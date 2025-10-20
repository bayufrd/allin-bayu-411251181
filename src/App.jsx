import React, { useState } from 'react'
import { gaussJordan, cramers, gaussJordanWithSteps, cramersWithSteps } from './solver'
import MatrixInput from './MatrixInput'

function parseMatrix(text) {
    return text
        .trim()
        .split('\n')
        .map(line => line.trim().split(/\s+/).map(Number))
}

export default function App() {
    const [mode, setMode] = useState('text') // 'text' or 'cell'
    const [matrixText, setMatrixText] = useState('2 1 -1\n-3 -1 2\n-2 1 2')
    const [vectorText, setVectorText] = useState('8\n-11\n-3')
    const [matrixCells, setMatrixCells] = useState([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]])
    const [vectorCells, setVectorCells] = useState([8, -11, -3])
    const [method, setMethod] = useState('gauss')
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [showSteps, setShowSteps] = useState(false)
    const [steps, setSteps] = useState(null)

    function solve() {
        setError(null)
        try {
            const A = mode === 'text' ? parseMatrix(matrixText) : matrixCells
            const b = mode === 'text' ? vectorText.trim().split(/\s+/).map(Number) : vectorCells
            if (A.length !== b.length) throw new Error('Matrix and vector size mismatch')
            let sol = null
            let outSteps = null
            if (showSteps) {
                if (method === 'gauss') {
                    const res = gaussJordanWithSteps(A, b)
                    sol = res.solution
                    outSteps = res.steps
                } else {
                    const res = cramersWithSteps(A, b)
                    sol = res.solution
                    outSteps = res.steps
                }
            } else {
                if (method === 'gauss') sol = gaussJordan(A, b)
                else sol = cramers(A, b)
            }
            setResult(sol.map((v, i) => `x${i + 1} = ${v.toFixed(6)}`))
            setSteps(outSteps)
        } catch (e) {
            setError(e.message)
            setResult(null)
        }
    }

    return (
        <div className="container">
            <div className="header-right">
                <h3>Bayu Farid Mulyanto</h3>
                <h3>411251181</h3>
                <h5>Aljabar Linier dan Matriks - H215C (Dr. Ir. R. Deiny Mardian W., ST., MT,)</h5>
            </div>

            <h1>Pemecah Sistem Linier</h1>

            <div className="tabs">
                <button className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>Input teks</button>
                <button className={mode === 'cell' ? 'active' : ''} onClick={() => setMode('cell')}>Input sel</button>
            </div>

            {mode === 'text' ? (
                <>
                    <p>Masukkan matriks A (satu baris per baris, angka dipisah spasi) dan vektor b (satu angka per baris).</p>
                    <div className="grid">
                        <div>
                            <label>Matriks A</label>
                            <textarea value={matrixText} onChange={e => setMatrixText(e.target.value)} rows={8} />
                        </div>
                        <div>
                            <label>Vektor b</label>
                            <textarea value={vectorText} onChange={e => setVectorText(e.target.value)} rows={8} />
                        </div>
                    </div>
                </>
            ) : (
                <MatrixInput
                    matrix={matrixCells}
                    vector={vectorCells}
                    onChangeMatrix={setMatrixCells}
                    onChangeVector={setVectorCells}
                />
            )}

            <div className="row">
                <label>
                    <input type="radio" name="method" value="gauss" checked={method === 'gauss'} onChange={() => setMethod('gauss')} /> Gauss-Jordan
                </label>
                <label>
                    <input type="radio" name="method" value="cramer" checked={method === 'cramer'} onChange={() => setMethod('cramer')} /> Aturan Cramer
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={showSteps} onChange={e => setShowSteps(e.target.checked)} /> Tampilkan langkah
                </label>
                <button onClick={solve}>Selesaikan</button>
            </div>

            {error && <div className="error">Error: {error}</div>}
            {result && (
                <div className="result">
                    <h3>Solusi</h3>
                    <ul>
                        {result.map((r, i) => (
                            <li key={i}>{r}</li>
                        ))}
                    </ul>
                </div>
            )}

            {showSteps && steps && (
                <div className="steps">
                    <h3>Prosedur / Langkah</h3>
                    <ol>
                        {steps.map((s, i) => (
                            <li key={i}>
                                <div style={{ fontWeight: 600 }}>{s.text}</div>
                                {s.matrix && (
                                    <pre style={{ overflowX: 'auto' }}>{s.matrix.map(row => row.map(v => Number.isFinite(v) ? v.toFixed(4) : v).join('\t')).join('\n')}</pre>
                                )}
                                {s.value !== undefined && <div>Nilai: {s.value}</div>}
                                {s.solution && <div>Solusi: {s.solution.map(v => v.toFixed(6)).join(', ')}</div>}
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            <footer>
                <small>Contoh: A= [[2,1,-1],[-3,-1,2],[-2,1,2]] b=[8,-11,-3]</small>
            </footer>
        </div>
    )
}
