export function byId(id) {
  return document.getElementById(id)
}

/** Cria um elemento com classe e texto em uma linha só. */
export function el(tag, className, text = '') {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}
