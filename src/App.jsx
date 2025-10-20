import React, { useState } from 'react'
import { gaussJordan, cramers } from './solver'

function parseMatrix(text) {
  return text
    .trim()
    .split('\n')
    .map(line => line.trim().split(/\s+/).map(Number))
}

export default function App() {
  const [matrixText, setMatrixText] = useState('2 1 -1\n-3 -1 2\n-2 1 2')
  const [vectorText, setVectorText] = useState('8\n-11\n-3')
  const [method, setMethod] = useState('gauss')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function solve() {
    setError(null)
    try {
      const A = parseMatrix(matrixText)
      const b = vectorText.trim().split(/\s+/).map(Number)
      if (A.length !== b.length) throw new Error('Matrix and vector size mismatch')
      let sol = null
      if (method === 'gauss') sol = gaussJordan(A, b)
      else sol = cramers(A, b)
      setResult(sol.map((v, i) => `x${i + 1} = ${v.toFixed(6)}`))
    } catch (e) {
      setError(e.message)
      setResult(null)
    }
  }

  return (
    <div className="container">
      <h1>Linear System Solver</h1>
      <p>Enter matrix A (one row per line, numbers separated by spaces) and vector b (one number per line).</p>
      <div className="grid">
        <div>
          <label>Matrix A</label>
          <textarea value={matrixText} onChange={e => setMatrixText(e.target.value)} rows={8} />
        </div>
        <div>
          <label>Vector b</label>
          <textarea value={vectorText} onChange={e => setVectorText(e.target.value)} rows={8} />
        </div>
      </div>

      <div className="row">
        <label>
          <input type="radio" name="method" value="gauss" checked={method === 'gauss'} onChange={() => setMethod('gauss')} /> Gauss-Jordan
        </label>
        <label>
          <input type="radio" name="method" value="cramer" checked={method === 'cramer'} onChange={() => setMethod('cramer')} /> Cramer's Rule
        </label>
        <button onClick={solve}>Solve</button>
      </div>

      {error && <div className="error">Error: {error}</div>}
      {result && (
        <div className="result">
          <h3>Solution</h3>
          <ul>
            {result.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <footer>
        <small>Example: A= [[2,1,-1],[-3,-1,2],[-2,1,2]] b=[8,-11,-3]</small>
      </footer>
    </div>
  )
}
