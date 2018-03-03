/**
 * unreadable string generator
 */

import { map } from "lodash";
import { MetaClass, MetaFunction } from "./meta_js";
import { parseEntityCRUDFunctionsMap, ODataMetadata, parseMetaClassFromDefault, parseMetaCRUDFunctionFromDefault } from ".";
import { CliOption } from "../cli/type";

export function generateAllDefault(meta: ODataMetadata, options?: CliOption) {
  let out = ""
  out += generateCommonImportString(options.uri, options.user, options.pass)
  out += parseMetaClassFromDefault(meta).map(c => generateClassString(c)).join("\n")
  out += parseMetaCRUDFunctionFromDefault(meta).map(f => generateFunctionString(f)).join("\n")
  out += generateOperationObject(meta)
  return out
}

export function generateCommonImportString(uri: string, user: string = "", pass: string = "") {
  return `// eslint-disable-next-line
import { OData, ODataQueryParam, ODataFilter, C4CODataResult, C4CEntity, DeferredNavigationProperty, C4CODataSingleResult } from "c4codata";

const metadataUri = "${uri}"
// set object value to change odata credential
const initCredential = { username: "${user}", password: "${pass}" }
export const odata = new OData(metadataUri, initCredential);
`
}

/**
 * Generate Class string from meta class
 * 
 * @export
 * @param {MetaClass} clazz 
 * @returns 
 */
export function generateClassString(clazz: MetaClass) {
  return `
/**
 * ${clazz.name}
 * 
 * @class ${clazz.name}
 */
${clazz.exported ? "export " : ""}class ${clazz.name} ${clazz.extends ? `extends ${clazz.extends} ` : ""}{
${clazz.field ? clazz.field.map(f => `
  /**
   * ${f.description ? f.description : ""}
   * @type {${f.type}} 
   */
  ${f.name}${f.value ? ` = ${f.value}` : ""}`).join("\n") : ""}
${clazz.method ? clazz.method.map(m => `
  /**
   * ${m.description ? m.description : ""}
${m.parameters ? m.parameters.map(p => `   * @param {${p.type ? p.type : "any"}} ${p.name} `).join("\n") : ""}
${m.return ? `   * @returns {m.return}` : ""}
   */
  ${m.static ? "static " : ""}${m.name}(${m.parameters ? m.parameters.map(p => p.name).join(", ") : ""}) {
    ${m.body ? m.body : ""}
  }
`).join("\n") : ""}
}`
}

export function generateFunctionString(func: MetaFunction) {
  return `
/**
 * ${func.name}
 * ${func.description ? func.description : ""}
${func.parameters ? func.parameters.map(p => ` * @param {${p.type ? p.type : "any"}} ${p.name} `).join("\n") : ""}
${func.return ? ` * @returns {${func.return}}` : ""}
 */
${func.exported ? "export " : ""}function ${func.name}(${func.parameters ? func.parameters.map(p => p.name).join(", ") : ""}) {
  ${func.body ? func.body : ""}
}
`
}

export function generateCRUDFunctionDefault(metaFunctions: MetaFunction[]) {
  return metaFunctions.map(f => generateFunctionString(f)).join()
}

export function generateOperationObject(meta: ODataMetadata): string {
  return `
export const CollectionOperation = {
${map(parseEntityCRUDFunctionsMap(meta), (m, k) => `  ${k}: {
${map(m, item => `    ${item}`).join(",\n")}
  }`).join(",\n")}
}  
`
}