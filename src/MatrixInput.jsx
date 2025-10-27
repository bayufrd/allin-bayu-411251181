import React from 'react'

function range(n) {
  return Array.from({length: n}, (_, i) => i)
}

export default function MatrixInput({ matrix, vector, onChangeMatrix, onChangeVector }) {
  const n = matrix.length

  // normalize a string value to a Number: accept comma as decimal separator
  function parseNumberInput(value) {
    if (value === null || value === undefined) return NaN
    if (typeof value === 'number') return value
    const s = String(value).trim().replace(/,/g, '.')
    if (s === '') return NaN
    const v = Number(s)
    return Number.isFinite(v) ? v : NaN
  }

  function updateCell(r, c, value) {
    const v = parseNumberInput(value)
    const copy = matrix.map(row => row.slice())
    copy[r][c] = Number.isNaN(v) ? value : v
    onChangeMatrix(copy)
  }

  function updateVector(i, value) {
    const v = parseNumberInput(value)
    const copy = vector.slice()
    copy[i] = Number.isNaN(v) ? value : v
    onChangeVector(copy)
  }

  function addRow() {
    // add a new row (do not auto-balance columns)
    const cols = matrix[0].length
    const newRow = Array(cols).fill(0)
    onChangeMatrix([...matrix, newRow])
    onChangeVector([...vector, 0])
  }

  function removeRow() {
    if (matrix.length <= 1) return
    onChangeMatrix(matrix.slice(0, -1))
    onChangeVector(vector.slice(0, -1))
  }

  function addColumn() {
    // add a new column (do not auto-add rows)
    const copy = matrix.map(row => [...row, 0])
    onChangeMatrix(copy)
  }

  function removeColumn() {
    if (matrix[0].length <= 1) return
    const copy = matrix.map(row => row.slice(0, -1))
    onChangeMatrix(copy)
  }

  // validation: return an error string if invalid, otherwise null
  function getValidationError() {
    if (!matrix || !matrix.length) return 'Matriks A kosong'
    const rows = matrix.length
    const cols = matrix[0].length
    // ensure rectangular
    for (let i = 0; i < rows; i++) {
      if (!Array.isArray(matrix[i]) || matrix[i].length !== cols) return 'Setiap baris harus memiliki jumlah kolom yang sama'
    }
    if (rows !== cols) return 'Matriks harus berbentuk bujur sangkar (n × n) untuk solusi unik'
    if (!vector || vector.length !== rows) return 'Vektor b harus memiliki panjang sama dengan jumlah baris A'
    // check numeric values
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const v = parseNumberInput(matrix[i][j])
        if (Number.isNaN(v)) return `Nilai tidak valid di A[${i+1},${j+1}]: '${matrix[i][j]}'`
      }
      const vb = parseNumberInput(vector[i])
      if (Number.isNaN(vb)) return `Nilai tidak valid di b[${i+1}]: '${vector[i]}'`
    }
    return null
  }

  return (
    <div className="matrix-area">
      <div className="matrix-controls">
        <button onClick={addRow}>Tambah baris</button>
        <button onClick={removeRow}>Hapus baris</button>
        <button onClick={addColumn}>Tambah kolom</button>
        <button onClick={removeColumn}>Hapus kolom</button>
      </div>
      {/* inline validation message for cell input */}
      {(() => {
        const err = getValidationError()
        return err ? <div className="matrix-input-error">{err}</div> : null
      })()}

      <div className="matrix-grid">
        <div className="matrix-wrap">
          {range(n).map(r => (
            <div key={r} className="matrix-row">
              {range(matrix[0].length).map(c => (
                <React.Fragment key={c}>
                  <div className="cell-with-label">
                    <input
                      className="cell"
                      value={matrix[r][c]}
                      onChange={e => updateCell(r, c, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Tab') {
                          // native tab is fine; we'll keep default behavior
                        }
                      }}
                    />
                    <span className="col-label">x<sub>{c + 1}</sub></span>
                  </div>
                  {c < matrix[0].length - 1 && <span className="plus">+</span>}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>

        <div className="vector-wrap">
          {range(n).map(i => (
            <div key={i} className="vector-row">
              <span className="equals">=</span>
              <input className="cell vector-cell" value={vector[i]} onChange={e => updateVector(i, e.target.value)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
