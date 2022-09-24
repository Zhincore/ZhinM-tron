type ArrayLengthMutationKeys = "splice" | "push" | "pop" | "shift" | "unshift" | number;
type ArrayItems<T extends Array<any>> = T extends Array<infer TItems> ? TItems : never;
type FixedLengthArray<T extends any[]> = Pick<T, Exclude<keyof T, ArrayLengthMutationKeys>> & {
  [Symbol.iterator]: () => IterableIterator<ArrayItems<T>>;
};

export type IVector3 = [number, number, number];

interface IVector3Constuctor {
  new (...items: number[]): FixedLengthArray<IVector3> & { [x in number]: number };
}

export class Vector3 extends (Array as any as IVector3Constuctor) {
  constructor(x: number, y: number, z: number);
  constructor(vec: IVector3 | number[]);
  constructor(x: number | IVector3 | number[] = 0, y = 0, z = 0) {
    if (Array.isArray(x)) super(...x);
    else super(x, y, z);
  }

  get x() {
    return this[0];
  }
  set x(val: number) {
    this[0] = val;
  }

  get y() {
    return this[1];
  }
  set y(val: number) {
    this[1] = val;
  }

  get z() {
    return this[2];
  }
  set z(val: number) {
    this[2] = val;
  }

  private getVec(vecOrScal: Vector3 | number) {
    return typeof vecOrScal === "number" ? [vecOrScal, vecOrScal, vecOrScal] : vecOrScal;
  }

  add(vecOrScal: Vector3 | number) {
    const vec = this.getVec(vecOrScal);
    return new Vector3(this.map((v, i) => v + vec[i]));
  }

  sub(vecOrScal: Vector3 | number) {
    const vec = this.getVec(vecOrScal);
    return new Vector3(this.map((v, i) => v - vec[i]));
  }

  mult(vecOrScal: Vector3 | number) {
    const vec = this.getVec(vecOrScal);
    return new Vector3(this.map((v, i) => v * vec[i]));
  }

  div(vecOrScal: Vector3 | number) {
    const vec = this.getVec(vecOrScal);
    return new Vector3(this.map((v, i) => v / vec[i]));
  }

  toTuple() {
    return Array.from(this) as [number, number, number];
  }

  getLength() {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
  }

  equals(vec: Vector3 | IVector3) {
    return this.every((v, i) => v === vec[i]);
  }
}
