const globalPlugins = []

export function registerPlugin (plugin) {
  if (!plugin.name) {
    throw new Error('[dfe-autocomplete] Plugin must have a name')
  }
  globalPlugins.push(plugin)
}

export function getGlobalPlugins () {
  return globalPlugins
}

export function clearGlobalPlugins () {
  globalPlugins.length = 0
}
