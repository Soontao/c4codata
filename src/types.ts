import * as UrlSearchParam from "url-search-params"
import { concat, assign, isArray, isObject } from "lodash";
import { OData } from ".";

export type HTTPMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface PlainODataResponse {
  d?: {
    _count?: string,
    results: any[] | any
  }
  error?: {
    code: string,
    message: {
      lang: string,
      value: string
    }
  }
}


export class FilterBase {

  protected filter: ODataFilter

  toString() {
    return this.filter.toString()
  }

  build() {
    return this.filter.build();
  }
}

export class FilterField extends FilterBase {

  constructor(filter: ODataFilter) {
    super()
    this.filter = filter;
  }

  field(name) {
    this.filter.field(name)
    return this.filter.FilterExpr
  }


}

export class FilterAndOr extends FilterBase {

  constructor(filter: ODataFilter) {
    super()
    this.filter = filter;
  }


  and(filter?: string) {
    this.filter.and(filter)
    return this.filter.FilterField
  }

  or(filter?: string) {
    this.filter.or(filter)
    return this.filter.FilterField
  }

}

export class FilterExpr extends FilterBase {

  constructor(filter: ODataFilter) {
    super()
    this.filter = filter;
  }

  eq(value: string) {
    this.filter.eq(value)
    return this.filter.FilterAndOr
  }

  ge(value: string) {
    this.filter.ge(value)
  }

  le(value: string) {
    this.filter.le(value)
  }

  lt(value: string) {
    this.filter.lt(value)
  }

}

export class ODataFilter {

  static newBuilder() {
    return new ODataFilter().FilterField
  }

  FilterField: FilterField = new FilterField(this)

  FilterAndOr: FilterAndOr = new FilterAndOr(this)

  FilterExpr: FilterExpr = new FilterExpr(this)

  private filterStr = "";

  build() {
    return this.filterStr;
  }

  field(name: string) {
    this.filterStr += name;
    return this;
  }

  eq(value) {
    this.filterStr += ` eq ${value}`;
    return this;
  }

  ge(value) {
    this.filterStr += ` ge ${value}`;
    return this;
  }

  le(value) {
    this.filterStr += ` le ${value}`;
    return this;
  }

  lt(value) {
    this.filterStr += ` lt ${value}`;
    return this;
  }

  and(filter?: string) {
    if (filter) {
      this.filterStr = `(${this.filterStr}) and (${filter})`;
    } else {
      this.filterStr += " and ";
    }
    return this;
  }

  or(filter?: string) {
    if (filter) {
      this.filterStr = `(${this.filterStr}) or (${filter})`;
    } else {
      this.filterStr += " or ";
    }
    return this;
  }

  toString() {
    return this.build();
  }

}

export class ODataQueryParam {

  static newParam() {
    return new ODataQueryParam()
  }

  private $skip = 0
  private $filter: string | FilterBase
  private $top = 30
  private $select: string[] = []
  private $orderby: string
  private $format: "json" | "xml" = "json"
  private $search: string

  /**
   * filter
   * @param filter 
   */
  filter(filter: string | FilterBase) {
    this.$filter = filter
    return this
  }

  /**
   * skip first records
   * @param skip 
   */
  skip(skip: number) {
    this.$skip = skip
    return this
  }


  /**
   * limit result max records
   * 
   * @param top 
   */
  top(top: number) {
    this.$top = top
    return this
  }


  /**
   * select viewed fields
   * 
   * @param selects 
   */
  select(selects: string | string[]) {
    this.$select = concat(this.$select, selects)
    return this
  }

  /**
   * set order sequence
   * @param field 
   * @param order 
   */
  orderby(field: string, order: "asc" | "desc" = "desc") {
    this.$orderby = `${field} ${order}`
    return this
  }

  /**
   * result format, please keep it as json
   * @param format 
   */
  format(format: "json" | "xml") {
    this.$format = format
    return this
  }

  /**
   * full text search
   * @param value 
   */
  search(value: string, fuzzy: boolean = true) {
    this.$search = fuzzy ? `%${value}%` : value
    return this
  }

  /**
   * expand navigation props
   * @param fields 
   */
  expand(fields: string | string[]) {
    this.$expand = concat(this.$expand, fields)
    return this
  }

  /**
   * @type {string[]}
   */
  private $expand: string[] = []

  toString(): string {
    let rt = new UrlSearchParam();
    if (this.$filter) { rt.append("$filter", this.$filter.toString()); }
    if (this.$format) { rt.append("$format", this.$format); }
    if (this.$orderby) { rt.append("$orderby", this.$orderby); }
    if (this.$search) { rt.append("$search", this.$search); }
    if (this.$select) { rt.append("$select", this.$select); }
    if (this.$skip) { rt.append("$skip", this.$skip); }
    if (this.$top) { rt.append("$top", this.$top); }
    if (this.$expand) { rt.append("$expand", this.$expand.join(",")); }
    return rt.toString();
  }
}

export class C4CODataSingleResult<T> {

  d: { results: T } = { results: undefined }

  static fromPlainObject = function <E>(object: PlainODataResponse, type: { new(): E }) {
    const rt = new C4CODataSingleResult<E>()
    if (object.error) {
      throw new Error(object.error.message.value)
    }
    rt.d.results = C4CEntity.fromPlainObject(object.d.results, type)
    return rt;
  }


  static fromRequestResult = async function <T>(p: Promise<PlainODataResponse>, t: { new(): T }) {
    return C4CODataSingleResult.fromPlainObject(await p, t)
  }

}

export class C4CODataResult<T> {

  d: { results: T[] } = { results: [] }

  static fromPlainObject = function <E>(object: PlainODataResponse, type: { new(): E }) {
    const rt = new C4CODataResult<E>()
    if (object.error) {
      throw new Error(object.error.message.value)
    }
    rt.d.results = object.d.results.map(e => C4CEntity.fromPlainObject(e, type))
    return rt;
  }


  static fromRequestResult = async function <T>(p: Promise<PlainODataResponse>, t: { new(): T }): Promise<C4CODataResult<T>> {
    return C4CODataResult.fromPlainObject(await p, t)
  }

}

export class C4CEntity {

  __metadata: {
    uri: string,
    type: string,
    etag?: string
  }

  _odata: OData

  _type: C4CEntity

  ObjectID: string

  ParentObjectID?: string

  /**
   * parse instance from plain object
   * @param o 
   */
  static fromPlainObject = function <T>(o: any, t: { new(): T; }): T {
    return assign(new t(), o);
  }

  static fromRequestResult = async function <T>(o: Promise<any>, t: { new(): T; }): Promise<T> {
    return C4CEntity.fromPlainObject(await o, t)
  }

  update() {
    return this._odata.requestUri(this.__metadata.uri, undefined, "PATCH", this)
  }

  delete() {
    return this._odata.requestUri(this.__metadata.uri, undefined, "DELETE", this)
  }

}

export class DeferredNavigationProperty {
  __deferred: {
    uri: string
  }
}

declare global {
  module Edm {
    type String = string
    type Guid = string
    type DateTime = string
    type DateTimeOffset = string
    type Boolean = boolean
    type Decimal = number
    /**
     * base64 string
     */
    type Binary = string
  }
}