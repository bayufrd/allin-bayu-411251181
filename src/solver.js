// Gaussian elimination (Gauss-Jordan) and Cramer's Rule implementations

export function gaussJordan(a, b) {
  return gaussJordanWithSteps(a, b).solution
}

export function gaussJordanWithSteps(a, b) {
  const n = a.length
  const M = a.map((row, i) => [...row, b[i]])
  const steps = []

  steps.push({ text: 'Matriks augmentasi awal', matrix: M.map(r => r.slice()) })

  for (let i = 0; i < n; i++) {
    // find pivot
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k
    }
    if (Math.abs(M[maxRow][i]) < 1e-12) {
      throw new Error('Matriks singular atau hampir singular')
    }
    // swap
    if (maxRow !== i) {
      const tmp = M[i]
      M[i] = M[maxRow]
      M[maxRow] = tmp
      steps.push({ text: `Tukar baris ${i} dengan baris ${maxRow}`, matrix: M.map(r => r.slice()) })
    }
    // normalize pivot row
    const pivot = M[i][i]
    for (let j = i; j <= n; j++) M[i][j] /= pivot
    steps.push({ text: `Normalisasi baris ${i} dengan pivot ${pivot}`, matrix: M.map(r => r.slice()) })
    // eliminate other rows
    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = M[r][i]
        for (let c = i; c <= n; c++) M[r][c] -= factor * M[i][c]
        steps.push({ text: `Hilangkan kolom ${i} dari baris ${r} menggunakan faktor ${factor}`, matrix: M.map(rw => rw.slice()) })
      }
    }
  }
  const solution = M.map(row => row[n])
  steps.push({ text: 'Bentuk tereduksi (solusi pada kolom terakhir)', matrix: M.map(r => r.slice()) })
  return { solution, steps }
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

// Compute determinant using Gaussian elimination (partial pivoting) and record steps.
export function detWithSteps(input) {
  const n = input.length
  const M = input.map(r => r.slice())
  const steps = []
  let sign = 1

  steps.push({ text: 'Mulai perhitungan determinan (bentuk matriks)', matrix: M.map(r => r.slice()) })

  for (let i = 0; i < n; i++) {
    // find pivot
    let maxRow = i
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > Math.abs(M[maxRow][i])) maxRow = r
    }
    if (Math.abs(M[maxRow][i]) < 1e-12) {
      steps.push({ text: `Pivot di kolom ${i} hampir nol -> determinan = 0` })
      return { value: 0, steps }
    }
    if (maxRow !== i) {
      const tmp = M[i]
      M[i] = M[maxRow]
      M[maxRow] = tmp
      sign *= -1
      steps.push({ text: `Tukar baris ${i} dengan baris ${maxRow}`, matrix: M.map(r => r.slice()) })
    }

    // eliminate below
    for (let r = i + 1; r < n; r++) {
      const factor = M[r][i] / M[i][i]
      if (Math.abs(factor) > 0) {
        for (let c = i; c < n; c++) M[r][c] -= factor * M[i][c]
        steps.push({ text: `Eliminasi: kurangi baris ${r} dengan faktor ${factor} * baris ${i}`, matrix: M.map(rr => rr.slice()), factor, row: r, pivotRow: i })
      }
    }
  }

  const diagProd = M.reduce((acc, row, idx) => acc * row[idx], 1)
  const value = sign * diagProd
  steps.push({ text: `Matriks segitiga atas (perkalian diagonal untuk determinan)`, matrix: M.map(r => r.slice()) })
  steps.push({ text: `Determinant = sign(${sign}) * product(diagonal) = ${value}`, value })
  return { value, steps }
}

export function cramers(a, b) {
  return cramersWithSteps(a, b).solution
}

export function cramersWithSteps(a, b) {
  const n = a.length
  const steps = []
  const Dres = detWithSteps(a)
  const D = Dres.value
  steps.push({ text: `Determinan D`, value: D, detSteps: Dres.steps })
  if (Math.abs(D) < 1e-12) throw new Error('Determinan nol (tidak ada solusi unik)')
  const solutions = []
  for (let i = 0; i < n; i++) {
    const Ai = a.map((row, r) => row.map((val, c) => (c === i ? b[r] : val)))
    const DresI = detWithSteps(Ai)
    const Di = DresI.value
    steps.push({ text: `Determinan D_${i+1} (ganti kolom ${i} dengan vektor b)`, value: Di, matrix: Ai.map(r => r.slice()), detSteps: DresI.steps })
    solutions.push(Di / D)
  }
  // Push a concise solution step; the UI will render the x_i and D_i subscripts
  // and the detailed fraction D_i / D presentation from the `solution` array.
  steps.push({ text: 'Solusi akhir', solution: solutions.slice() })
  return { solution: solutions, steps }
}
