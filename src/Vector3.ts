export type IVector3 = [x: number, y: number, z: number];

interface IVector3Constuctor {
  new (...items: IVector3 | number[]): IVector3;
}

const Vector3Constuctor: IVector3Constuctor = Array as any;

export class Vector3 extends Vector3Constuctor {
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
    return new Vector3(this[0] + vec[0], this[1] + vec[1], this[2] + vec[2]);
  }

  sub(vecOrScal: Vector3 | number) {
    const vec = this.getVec(vecOrScal);
    return new Vector3(this[0] - vec[0], this[1] - vec[1], this[2] - vec[2]);
  }

  mult(vecOrScal: Vector3 | number) {
    const vec = this.getVec(vecOrScal);
    return new Vector3(this[0] * vec[0], this[1] * vec[1], this[2] * vec[2]);
  }

  div(vecOrScal: Vector3 | number) {
    const vec = this.getVec(vecOrScal);
    return new Vector3(this[0] / vec[0], this[1] / vec[1], this[2] / vec[2]);
  }

  asTuple() {
    return this as IVector3;
  }

  getLength() {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
  }

  inv() {
    return new Vector3(1 / this[0], 1 / this[1], 1 / this[2]);
  }

  normalise() {
    return this.div(this.getLength());
  }

  equals(vec: Vector3 | IVector3) {
    return this.every((v, i) => v === vec[i as 0]);
  }
}
