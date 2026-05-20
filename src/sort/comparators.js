export const hasWeight = (option) => option.weight > 0

export const byWeightThenAlphabetically = (a, b) => {
  if (a.weight > b.weight) return -1
  if (a.weight < b.weight) return 1
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return 0
}

export const optionName = (option) => option.name
