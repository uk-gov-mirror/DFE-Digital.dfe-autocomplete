const globalPlugins = []

function registerPlugin (plugin) {
  if (!plugin.name) {
    throw new Error('[dfe-autocomplete] Plugin must have a name')
  }
  globalPlugins.push(plugin)
}

function getGlobalPlugins () {
  return globalPlugins
}

function clearGlobalPlugins () {
  globalPlugins.length = 0
}

export { registerPlugin, getGlobalPlugins, clearGlobalPlugins }
