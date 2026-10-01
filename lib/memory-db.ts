import { ObjectId } from "mongodb";

type Query = Record<string, any>;
type Doc = Record<string, any>;

function matchesQuery(doc: Doc, query: Query): boolean {
  for (const [key, expected] of Object.entries(query)) {
    if (key === "$or" && Array.isArray(expected)) {
      const orMatched = expected.some((subQ) => matchesQuery(doc, subQ));
      if (!orMatched) return false;
      continue;
    }

    const actual = doc[key];

    if (expected !== null && typeof expected === "object") {
      if (expected instanceof ObjectId) {
        if (!actual || actual.toString() !== expected.toString()) return false;
      } else if (expected instanceof Date) {
        if (!actual || new Date(actual).getTime() !== expected.getTime()) return false;
      } else if ("$gt" in expected) {
        const val = expected.$gt;
        const compareVal = val instanceof Date ? val.getTime() : val;
        const actualVal = actual instanceof Date ? actual.getTime() : actual;
        if (!(actualVal > compareVal)) return false;
      } else if ("$gte" in expected) {
        const val = expected.$gte;
        const compareVal = val instanceof Date ? val.getTime() : val;
        const actualVal = actual instanceof Date ? actual.getTime() : actual;
        if (!(actualVal >= compareVal)) return false;
      } else if ("$lt" in expected) {
        const val = expected.$lt;
        const compareVal = val instanceof Date ? val.getTime() : val;
        const actualVal = actual instanceof Date ? actual.getTime() : actual;
        if (!(actualVal < compareVal)) return false;
      } else if ("$in" in expected && Array.isArray(expected.$in)) {
        const inMatched = expected.$in.some((item: any) => {
          if (item instanceof ObjectId && actual) {
            return actual.toString() === item.toString();
          }
          return actual === item;
        });
        if (!inMatched) return false;
      } else if ("$ne" in expected) {
        if (actual === expected.$ne) return false;
      } else if ("$regex" in expected) {
        const re = new RegExp(expected.$regex, expected.$options || "");
        if (!re.test(String(actual || ""))) return false;
      } else if ("$exists" in expected) {
        const exists = key in doc && doc[key] !== undefined;
        if (exists !== Boolean(expected.$exists)) return false;
      }
    } else if (expected instanceof ObjectId) {
      if (!actual || actual.toString() !== expected.toString()) return false;
    } else {
      if (actual !== expected) return false;
    }
  }
  return true;
}

export class MemoryCollection {
  private docs: Doc[] = [];

  constructor(public name: string) {}

  async createIndex() {
    return "index_ok";
  }

  async findOne(query: Query = {}, options: any = {}) {
    let matches = this.docs.filter((d) => matchesQuery(d, query));
    if (options?.sort) {
      matches = this.sortDocs(matches, options.sort);
    }
    return matches.length > 0 ? JSON.parse(JSON.stringify(matches[0])) : null;
  }

  find(query: Query = {}, options: any = {}) {
    let matches = this.docs.filter((d) => matchesQuery(d, query));

    const cursor = {
      sort: (sortObj: Record<string, number>) => {
        matches = this.sortDocs(matches, sortObj);
        return cursor;
      },
      limit: (num: number) => {
        matches = matches.slice(0, num);
        return cursor;
      },
      toArray: async () => {
        return JSON.parse(JSON.stringify(matches));
      },
    };

    if (options?.sort) {
      cursor.sort(options.sort);
    }
    if (options?.limit) {
      cursor.limit(options.limit);
    }

    return cursor;
  }

  private sortDocs(docs: Doc[], sortObj: Record<string, number>): Doc[] {
    return [...docs].sort((a, b) => {
      for (const [k, dir] of Object.entries(sortObj)) {
        const aVal = a[k];
        const bVal = b[k];
        if (aVal === bVal) continue;
        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;
        return aVal > bVal ? dir : -dir;
      }
      return 0;
    });
  }

  async insertOne(doc: Doc) {
    const clone = { ...doc };
    if (!clone._id) {
      clone._id = new ObjectId();
    }
    this.docs.push(clone);
    return { insertedId: clone._id, acknowledged: true };
  }

  async insertMany(docs: Doc[]) {
    const ids: ObjectId[] = [];
    for (const d of docs) {
      const res = await this.insertOne(d);
      ids.push(res.insertedId);
    }
    return { insertedIds: ids, acknowledged: true };
  }

  async updateOne(query: Query, update: any, options: { upsert?: boolean } = {}) {
    const idx = this.docs.findIndex((d) => matchesQuery(d, query));
    if (idx >= 0) {
      this.applyUpdate(this.docs[idx], update);
      return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
    }
    if (options.upsert) {
      const newDoc: Doc = { _id: new ObjectId() };
      for (const [k, v] of Object.entries(query)) {
        if (!k.startsWith("$") && typeof v !== "object") {
          newDoc[k] = v;
        }
      }
      if (update.$setOnInsert) {
        Object.assign(newDoc, update.$setOnInsert);
      }
      this.applyUpdate(newDoc, update);
      this.docs.push(newDoc);
      return { matchedCount: 0, modifiedCount: 0, upsertedId: newDoc._id, acknowledged: true };
    }
    return { matchedCount: 0, modifiedCount: 0, acknowledged: true };
  }

  async updateMany(query: Query, update: any) {
    let count = 0;
    for (const doc of this.docs) {
      if (matchesQuery(doc, query)) {
        this.applyUpdate(doc, update);
        count++;
      }
    }
    return { matchedCount: count, modifiedCount: count, acknowledged: true };
  }

  async findOneAndUpdate(query: Query, update: any, options: { returnDocument?: string; upsert?: boolean } = {}) {
    const idx = this.docs.findIndex((d) => matchesQuery(d, query));
    if (idx >= 0) {
      const doc = this.docs[idx];
      this.applyUpdate(doc, update);
      return JSON.parse(JSON.stringify(doc));
    }
    if (options.upsert) {
      const newDoc: Doc = { _id: new ObjectId() };
      for (const [k, v] of Object.entries(query)) {
        if (!k.startsWith("$") && typeof v !== "object") {
          newDoc[k] = v;
        }
      }
      if (update.$setOnInsert) {
        Object.assign(newDoc, update.$setOnInsert);
      }
      this.applyUpdate(newDoc, update);
      this.docs.push(newDoc);
      return JSON.parse(JSON.stringify(newDoc));
    }
    return null;
  }

  async deleteOne(query: Query) {
    const idx = this.docs.findIndex((d) => matchesQuery(d, query));
    if (idx >= 0) {
      this.docs.splice(idx, 1);
      return { deletedCount: 1, acknowledged: true };
    }
    return { deletedCount: 0, acknowledged: true };
  }

  async deleteMany(query: Query) {
    const initialLen = this.docs.length;
    this.docs = this.docs.filter((d) => !matchesQuery(d, query));
    return { deletedCount: initialLen - this.docs.length, acknowledged: true };
  }

  async countDocuments(query: Query = {}) {
    return this.docs.filter((d) => matchesQuery(d, query)).length;
  }

  private applyUpdate(doc: Doc, update: any) {
    if (update.$set) {
      Object.assign(doc, update.$set);
    }
    if (update.$unset) {
      for (const k of Object.keys(update.$unset)) {
        delete doc[k];
      }
    }
    if (update.$inc) {
      for (const [k, amount] of Object.entries(update.$inc)) {
        doc[k] = (Number(doc[k]) || 0) + Number(amount);
      }
    }
  }
}

export class MemoryDatabase {
  private collections = new Map<string, MemoryCollection>();

  collection(name: string): MemoryCollection {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MemoryCollection(name));
    }
    return this.collections.get(name)!;
  }

  async command(cmd: Record<string, any>) {
    if (cmd.ping) {
      return { ok: 1 };
    }
    return { ok: 1 };
  }
}

export const memoryDb = new MemoryDatabase();
