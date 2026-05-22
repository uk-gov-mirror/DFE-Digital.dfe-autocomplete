const hasWeight = (option) => option.weight > 0

const byWeightThenAlphabetically = (a, b) => {
  if (a.weight > b.weight) return -1
  if (a.weight < b.weight) return 1
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return 0
}

const optionName = (option) => option.name

export { hasWeight, byWeightThenAlphabetically, optionName }
