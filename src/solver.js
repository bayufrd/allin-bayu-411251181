// Gaussian elimination (Gauss-Jordan) and Cramer's Rule implementations

export function gaussJordan(a, b) {
  // a: matrix n x n, b: vector n
  const n = a.length
  // build augmented matrix
  const M = a.map((row, i) => [...row, b[i]])

  for (let i = 0; i < n; i++) {
    // find pivot
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k
    }
    if (Math.abs(M[maxRow][i]) < 1e-12) {
      throw new Error('Matrix is singular or nearly singular')
    }
    // swap
    if (maxRow !== i) {
      const tmp = M[i]
      M[i] = M[maxRow]
      M[maxRow] = tmp
    }
    // normalize pivot row
    const pivot = M[i][i]
    for (let j = i; j <= n; j++) M[i][j] /= pivot
    // eliminate other rows
    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = M[r][i]
        for (let c = i; c <= n; c++) M[r][c] -= factor * M[i][c]
      }
    }
  }
  // read solution
  return M.map(row => row[n])
}

function det(matrix) {
  const n = matrix.length
  if (n === 1) return matrix[0][0]
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]
  let D = 0
  for (let col = 0; col < n; col++) {
    // build submatrix
    const sub = []
    for (let r = 1; r < n; r++) {
      const row = []
      for (let c = 0; c < n; c++) if (c !== col) row.push(matrix[r][c])
      sub.push(row)
    }
    D += (col % 2 === 0 ? 1 : -1) * matrix[0][col] * det(sub)
  }
  return D
}

export function cramers(a, b) {
  const n = a.length
  const D = det(a)
  if (Math.abs(D) < 1e-12) throw new Error('Determinant is zero (no unique solution)')
  const solutions = []
  for (let i = 0; i < n; i++) {
    const Ai = a.map((row, r) => row.map((val, c) => (c === i ? b[r] : val)))
    solutions.push(det(Ai) / D)
  }
  return solutions
}
