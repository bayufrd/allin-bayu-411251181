import React from 'react'

function range(n) {
  return Array.from({length: n}, (_, i) => i)
}

export default function MatrixInput({ matrix, vector, onChangeMatrix, onChangeVector }) {
  const n = matrix.length

  function updateCell(r, c, value) {
    const copy = matrix.map(row => row.slice())
    copy[r][c] = Number(value)
    onChangeMatrix(copy)
  }

  function updateVector(i, value) {
    const copy = vector.slice()
    copy[i] = Number(value)
    onChangeVector(copy)
  }

  function addRow() {
    const newRow = Array(matrix[0].length).fill(0)
    onChangeMatrix([...matrix, newRow])
    onChangeVector([...vector, 0])
  }

  function removeRow() {
    if (matrix.length <= 1) return
    onChangeMatrix(matrix.slice(0, -1))
    onChangeVector(vector.slice(0, -1))
  }

  function addColumn() {
    const copy = matrix.map(row => [...row, 0])
    onChangeMatrix(copy)
  }

  function removeColumn() {
    if (matrix[0].length <= 1) return
    const copy = matrix.map(row => row.slice(0, -1))
    onChangeMatrix(copy)
  }

  return (
    <div className="matrix-area">
      <div className="matrix-controls">
        <button onClick={addRow}>Tambah baris</button>
        <button onClick={removeRow}>Hapus baris</button>
        <button onClick={addColumn}>Tambah kolom</button>
        <button onClick={removeColumn}>Hapus kolom</button>
      </div>

      <div className="matrix-grid">
        <div className="matrix-wrap">
          {range(n).map(r => (
            <div key={r} className="matrix-row">
              {range(matrix[0].length).map(c => (
                <input
                  key={c}
                  className="cell"
                  value={matrix[r][c]}
                  onChange={e => updateCell(r, c, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Tab') {
                      // native tab is fine; we'll keep default behavior
                    }
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="vector-wrap">
          {range(n).map(i => (
            <input key={i} className="cell vector-cell" value={vector[i]} onChange={e => updateVector(i, e.target.value)} />
          ))}
        </div>
      </div>
    </div>
  )
}
