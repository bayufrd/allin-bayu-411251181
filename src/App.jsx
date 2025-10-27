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
    const [mode, setMode] = useState('cell') // 'text' or 'cell'
    const [matrixText, setMatrixText] = useState('2 1 -1\n-3 -1 2\n-2 1 2')
    const [vectorText, setVectorText] = useState('8\n-11\n-3')
    const [matrixCells, setMatrixCells] = useState([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]])
    const [vectorCells, setVectorCells] = useState([8, -11, -3])
    const [method, setMethod] = useState('gauss')
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [showSteps, setShowSteps] = useState(true)
    const [steps, setSteps] = useState(null)

    function solve() {
        setError(null)
        try {
            const A = mode === 'text' ? parseMatrix(matrixText) : matrixCells
            const b = mode === 'text' ? vectorText.trim().split(/\s+/).map(Number) : vectorCells
            // Validate sizes: solver expects a square matrix (n x n) and vector length n
            if (!A || !A.length || !A[0] || typeof A[0].length !== 'number') throw new Error('Matriks A tidak valid')
            const n = A.length
            const m = A[0].length
            if (n !== m) throw new Error('Matriks harus berbentuk bujur sangkar (n x n). Pastikan jumlah baris dan kolom sama.')
            if (!b || b.length !== n) throw new Error('Vektor b harus mempunyai panjang yang sama dengan jumlah baris matriks A')

            // validate numeric entries
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    if (!Number.isFinite(Number(A[i][j]))) throw new Error(`Nilai tidak valid di A[${i+1},${j+1}]: '${A[i][j]}'`)
                }
                if (!Number.isFinite(Number(b[i]))) throw new Error(`Nilai tidak valid di b[${i+1}]: '${b[i]}'`)
            }
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
            // store numeric results; we'll format them on render to avoid excessive trailing zeros
            setResult(sol)
            setSteps(outSteps)
        } catch (e) {
            setError(e.message)
            setResult(null)
        }
    }

    // format numbers: limit decimals, remove trailing zeros, treat very small values as 0
    function formatNumber(v, maxDecimals = 6) {
        if (!Number.isFinite(v)) return String(v)
        if (Math.abs(v) < 1e-12) return '0'
        const s = v.toFixed(maxDecimals)
        // remove trailing zeros and optional trailing dot
        return s.replace(/\.0+$|(?<=\.[0-9]*?)0+$/g, '').replace(/\.$/, '')
    }

    // try to approximate a float as a fraction with denominator up to maxDen
    function approxFraction(x, maxDen = 20) {
        if (!Number.isFinite(x)) return null
        if (Math.abs(x - Math.round(x)) < 1e-12) return { n: Math.round(x), d: 1 }
        const sign = x < 0 ? -1 : 1
        x = Math.abs(x)
        let best = { n: Math.round(x), d: 1, err: Math.abs(x - Math.round(x)) }
        for (let d = 1; d <= maxDen; d++) {
            const n = Math.round(x * d)
            const err = Math.abs(x - n / d)
            if (err < best.err) best = { n, d, err }
            if (best.err === 0) break
        }
        if (best.err <= 1e-8) return { n: best.n * sign, d: best.d }
        return null
    }

    // render numbers either as stacked fraction (if approximable) or formatted decimal
    function renderValue(v, fracDen = 20, decimals = 6) {
        if (!Number.isFinite(v)) return String(v)
        if (Math.abs(v) < 1e-12) return '0'
        const frac = approxFraction(v, fracDen)
        if (frac && frac.d !== 1) {
            return (
                <span className="fraction" title={`${frac.n}/${frac.d}`}>
                    <span className="num">{frac.n}</span>
                    <span className="den">{frac.d}</span>
                </span>
            )
        }
        // integer or not approximable: show decimal (integers will not show .0)
        return formatNumber(v, decimals)
    }

    // render a string that may contain variables like D1, x1 or numbers; D1/x1 become subscripted
    function renderTextWithNumbers(text) {
        if (!text || typeof text !== 'string') return text
        const parts = []
        const regex = /([Dx]_?\d+)|(-?\d*\.?\d+(?:e[+-]?\d+)?)/ig
        let lastIndex = 0
        let m
        while ((m = regex.exec(text)) !== null) {
            if (m.index > lastIndex) parts.push({ type: 'text', value: text.slice(lastIndex, m.index) })
            if (m[1]) {
                // D1 or D_1 or x1 or x_1
                const mm = m[1].match(/^([Dx])_?(\d+)$/i)
                if (mm) parts.push({ type: 'var', letter: mm[1], num: mm[2] })
                else parts.push({ type: 'text', value: m[1] })
            } else if (m[2]) {
                parts.push({ type: 'number', value: Number(m[2]) })
            }
            lastIndex = regex.lastIndex
        }
        if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) })

        return parts.map((p, i) => {
            if (p.type === 'text') return <span key={i}>{p.value}</span>
            if (p.type === 'var') return <span key={i}>{p.letter}<sub>{p.num}</sub></span>
            if (p.type === 'number') {
                // if previous token is 'baris ' or 'kolom ', render as 1-based integer for human-friendly labels
                const prev = parts[i - 1]
                if (prev && prev.type === 'text' && /\b(baris|kolom)\s*$/i.test(prev.value)) {
                    const idx = Number(p.value)
                    const human = Number.isNaN(idx) ? p.value : idx + 1
                    return <span key={i}>{human}</span>
                }
                return <span key={i}>{renderValue(p.value, 50, 6)}</span>
            }
            return <span key={i}>{String(p.value)}</span>
        })
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
                    <div style={{ marginTop: 8 }}>
                        <div className="example-text">
                            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                                <small style={{ color: '#6b7280', fontWeight: 600 }}>Contoh:</small>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 6 }}>
                                    <div className="det-matrix-label">A =</div>
                                </div>
                                <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                                    <div className="matrix-with-brackets">
                                        <table className="matrix-table example-matrix">
                                            <tbody>
                                                {[[2,1,-1],[-3,-1,2],[-2,1,2]].map((row, i) => (
                                                    <tr key={i}>{row.map((v, c) => <td key={c} className="matrix-number">{renderValue(v, 50, 4)}</td>)}</tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: 8 }}>
                                        <div className="det-matrix-label">b =</div>
                                    </div>
                                    <div className="matrix-with-brackets">
                                        <table className="matrix-table example-b-table">
                                            <tbody>
                                                {[8, -11, -3].map((v, i) => (
                                                    <tr key={i}><td className="matrix-number">{renderValue(v, 50, 4)}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
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
                <button className="btn primary" onClick={solve}>Selesaikan</button>
            </div>

            {error && <div className="error">Error: {error}</div>}
            {result && (
                <div className="result">
                    <h3>Solusi</h3>
                    <ul>
                        {result.map((v, i) => (
                            <li key={i}><span className="var-label">x<sub>{i + 1}</sub></span>{' = '}{renderValue(v, 50, 6)}</li>
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
                                <div style={{ fontWeight: 600 }}>{renderTextWithNumbers(s.text)}</div>
                                {s.matrix && (() => {
                                    // check if this step is a determinant label like D_1
                                    const detMatch = (typeof s.text === 'string') && s.text.match(/D_?(\d+)/i)
                                    const label = detMatch ? (`D${detMatch[1] ? '_' + detMatch[1] : ''}`) : null
                                    const isAug = s.matrix && s.matrix[0] && s.matrix[0].length === s.matrix.length + 1
                                    return (
                                        <div style={{ overflowX: 'auto' }}>
                                            {label ? (
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <div className="det-matrix-label">{renderTextWithNumbers(label + ' |')}</div>
                                                    <div className="matrix-with-brackets">
                                                        <table className="matrix-table">
                                                            <tbody>
                                                                {s.matrix.map((row, idx) => (
                                                                    <tr key={idx}>{row.map((v, c) => (
                                                                        <td key={c} className={"matrix-number" + (isAug && c === row.length - 1 ? ' augmented-col' : '')}>{renderValue(v, 50, 4)}</td>
                                                                    ))}</tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="matrix-with-brackets">
                                                    <table className="matrix-table">
                                                        <tbody>
                                                            {s.matrix.map((row, idx) => (
                                                                <tr key={idx}>{row.map((v, c) => (
                                                                    <td key={c} className={"matrix-number" + (isAug && c === row.length - 1 ? ' augmented-col' : '')}>{renderValue(v, 50, 4)}</td>
                                                                ))}</tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })()}
                                {s.value !== undefined && <div>Nilai: {renderValue(s.value, 50, 6)}</div>}
                                {s.detSteps && (
                                    <div className="det-steps">
                                        <details>
                                            <summary>Rincian perhitungan determinan</summary>
                                            <ol>
                                                {s.detSteps.map((ds, di) => (
                                                    <li key={di}>
                                                        <div style={{ fontWeight: 600 }}>
                                                            {/* if ds has explicit factor, render it as fraction */}
                                                            {ds.factor !== undefined ? (
                                                                <span>Eliminasi: kurangi baris {ds.row + 1} dengan faktor {renderValue(ds.factor, 50, 8)} × baris {ds.pivotRow + 1}</span>
                                                            ) : (
                                                                renderTextWithNumbers(ds.text)
                                                            )}
                                                        </div>
                                                        {ds.matrix && (
                                                            <div style={{ overflowX: 'auto', marginTop: 6 }}>
                                                                <div className="matrix-with-brackets">
                                                                    <table className="matrix-table">
                                                                        <tbody>
                                                                            {ds.matrix.map((row, ridx) => (
                                                                                <tr key={ridx}>{row.map((val, cid) => <td key={cid} className="matrix-number">{renderValue(val, 50, 6)}</td>)}</tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {ds.value !== undefined && <div>Nilai interim: {renderValue(ds.value, 50, 6)}</div>}
                                                    </li>
                                                ))}
                                            </ol>
                                        </details>
                                    </div>
                                )}
                                {s.solution && (
                                    <div className="solution-details">
                                        3 
                                        <ol>
                                            {s.solution.map((v, idx) => {
                                                // find the corresponding D_i step (search earlier steps)
                                                const diStep = steps && steps.find(st => typeof st.text === 'string' && st.text.match(new RegExp(`Determinan\\s+D_${idx+1}|D_${idx+1}|Determinan\\s+D${idx+1}`, 'i')))
                                                const Dval = diStep && diStep.value !== undefined ? diStep.value : null
                                                // find the main D step
                                                const mainDStep = steps && steps.find(st => st.text && /Determinan\s+D$/i.test(st.text))
                                                const Dmain = mainDStep && mainDStep.value !== undefined ? mainDStep.value : null
                                                return (
                                                    <li key={idx}>
                                                        <div>
                                                            <span className="var-label">x<sub>{idx + 1}</sub></span>
                                                            = {Dval !== null ? <>{renderValue(Dval, 50, 8)} / {Dmain !== null ? renderValue(Dmain, 50, 8) : 'D'}</> : 'D_' + (idx+1) + ' / D'}
                                                            {' = '}{renderValue(v, 50, 6)}
                                                            {diStep && diStep.detSteps && (
                                                                <details style={{ display: 'inline-block', marginLeft: 8 }}>
                                                                    <summary style={{ display: 'inline' }}>lihat D<sub>{idx+1}</sub> langkah</summary>
                                                                    <ol>
                                                                        {diStep.detSteps.map((dsi, k) => (
                                                                            <li key={k}>
                                                                                <div style={{ fontWeight: 600 }}>{renderTextWithNumbers(dsi.text)}</div>
                                                                                {dsi.matrix && (
                                                                                    <div style={{ overflowX: 'auto', marginTop: 6 }}>
                                                                                        <div className="matrix-with-brackets">
                                                                                            <table className="matrix-table">
                                                                                                <tbody>
                                                                                                    {dsi.matrix.map((row, ridx) => (
                                                                                                        <tr key={ridx}>{row.map((val, cid) => <td key={cid} className="matrix-number">{renderValue(val, 50, 6)}</td>)}</tr>
                                                                                                    ))}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </li>
                                                                        ))}
                                                                    </ol>
                                                                </details>
                                                            )}
                                                        </div>
                                                    </li>
                                                )
                                            })}
                                        </ol>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            <footer />
        </div>
    )
}
