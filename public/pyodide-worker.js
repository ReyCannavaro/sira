importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js')

let pyodide = null
let loading = false

async function loadPyodide() {
  if (pyodide) return pyodide
  if (loading) return null
  loading = true
  pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
  })
  pyodide.runPython(`
import sys
import io
_stdout_capture = io.StringIO()
_stderr_capture = io.StringIO()
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture
`)
  loading = false
  return pyodide
}

loadPyodide()

self.onmessage = async (e) => {
  const { id, code, packages } = e.data

  try {
    const py = await loadPyodide()
    if (!py) {
      self.postMessage({ id, error: 'Pyodide sedang loading, coba lagi sebentar.' })
      return
    }

    if (packages && packages.length > 0) {
      try {
        await py.loadPackage(packages)
      } catch (pkgErr) {
        console.warn('Package load warning:', pkgErr)
      }
    }

    py.runPython(`
_stdout_capture.truncate(0)
_stdout_capture.seek(0)
_stderr_capture.truncate(0)
_stderr_capture.seek(0)
`)

    let result = null
    try {
      result = py.runPython(code)
    } catch (runErr) {
      const stderr = py.runPython('_stderr_capture.getvalue()')
      self.postMessage({
        id,
        output: '',
        error: runErr.message || String(runErr),
        stderr: stderr || '',
      })
      return
    }

    const stdout = py.runPython('_stdout_capture.getvalue()')
    const stderr = py.runPython('_stderr_capture.getvalue()')

    self.postMessage({
      id,
      output: stdout || '',
      stderr: stderr || '',
      result: result !== undefined && result !== null ? String(result) : null,
      error: null,
    })

  } catch (err) {
    self.postMessage({
      id,
      output: '',
      error: err.message || String(err),
      stderr: '',
    })
  }
}