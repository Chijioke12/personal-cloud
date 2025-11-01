
import { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

function bytesToSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k,i)).toFixed(2)) + ' ' + sizes[i];
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [encrypt, setEncrypt] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const CHUNK_SIZE = 1024 * 1024; // 1MB
  const controllerRef = useRef(null);

  async function fetchMe() {
    const res = await fetch('/api/me');
    if (res.ok) setUser(await res.json());
    else setUser(null);
  }

  async function listFiles() {
    const res = await fetch('/api/files/list');
    if (res.ok) setFiles(await res.json().then(r => r.files));
  }

  useEffect(() => {
    fetchMe();
    listFiles();
  }, []);

  async function register(e) {
    e.preventDefault();
    const res = await fetch('/api/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) });
    if (res.ok) { await fetchMe(); await listFiles(); }
    else alert('register failed');
  }

  async function login(e) {
    e.preventDefault();
    const res = await fetch('/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) });
    if (res.ok) { await fetchMe(); await listFiles(); }
    else alert('login failed');
  }

  async function uploadSmall(e) {
    e.preventDefault();
    if (!file) return alert('pick a file');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/files/upload', { method: 'POST', body: fd });
    if (res.ok) { setFile(null); await listFiles(); }
    else alert('upload failed');
  }

  async function deriveKey(pass) {
    const enc = new TextEncoder();
    const salt = enc.encode('personal-cloud-salt');
    const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']);
  }

  async function encryptChunk(key, chunk) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, chunk);
    const ivBuf = new Uint8Array(iv);
    const ctBuf = new Uint8Array(encrypted);
    const out = new Uint8Array(ivBuf.length + ctBuf.length);
    out.set(ivBuf, 0);
    out.set(ctBuf, ivBuf.length);
    return out.buffer;
  }

  async function uploadChunked(e) {
    e.preventDefault();
    if (!file) return alert('pick a file');
    controllerRef.current = new AbortController();
    const uploadId = uuidv4();
    const total = Math.ceil(file.size / CHUNK_SIZE);
    let derivedKey = null;
    if (encrypt) derivedKey = await deriveKey(passphrase);

    for (let i = 0; i < total; ++i) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      let slice = file.slice(start, end);
      let body = slice;
      if (encrypt) {
        const arr = await slice.arrayBuffer();
        const encBuf = await encryptChunk(derivedKey, arr);
        body = new Blob([encBuf]);
      }
      const headers = {
        'x-upload-id': uploadId,
        'x-chunk-index': String(i),
        'x-filename': file.name
      };
      const res = await fetch('/api/files/chunk', { method: 'POST', body, headers, signal: controllerRef.current.signal });
      if (!res.ok) { alert('chunk upload failed at ' + i); return; }
    }
    const res2 = await fetch('/api/files/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uploadId, total, filename: file.name, mime: file.type }) });
    if (res2.ok) { setFile(null); await listFiles(); alert('upload complete'); }
    else { alert('assemble failed'); }
  }

  async function download(id) {
    const res = await fetch(`/api/files/download?id=${id}`);
    if (!res.ok) return alert('download failed');
    const { url } = await res.json();
    window.open(url, '_blank');
  }

  async function del(id) {
    if (!confirm('Delete file?')) return;
    const res = await fetch(`/api/files/delete?id=${id}`, { method: 'DELETE' });
    if (res.ok) await listFiles();
    else alert('delete failed');
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Personal Cloud (Next.js)</h1>
      {!user && (
        <div style={{ display: 'flex', gap: 16 }}>
          <form onSubmit={register}>
            <h3>Register</h3>
            <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
            <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="submit">Register</button>
          </form>
          <form onSubmit={login}>
            <h3>Login</h3>
            <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
            <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="submit">Login</button>
          </form>
        </div>
      )}

      {user && (
        <>
          <div>
            <strong>Hi {user.username}</strong>
          </div>

          <form onSubmit={uploadSmall} style={{ marginTop: 16 }}>
            <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
            <button type="submit">Upload (single-shot)</button>
          </form>

          <div style={{ marginTop: 12 }}>
            <h4>Or resumable chunked upload (1MB chunks)</h4>
            <label><input type="checkbox" checked={encrypt} onChange={e=>setEncrypt(e.target.checked)} /> Encrypt client-side (AES-GCM)</label>
            {encrypt && <div><input placeholder="Encryption passphrase" value={passphrase} onChange={e=>setPassphrase(e.target.value)} /></div>}
            <form onSubmit={uploadChunked}>
              <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
              <button type="submit">Start chunked upload</button>
            </form>
          </div>

          <h3 style={{ marginTop: 24 }}>Files</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Name</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id}>
                  <td>{f.filename}</td>
                  <td>{bytesToSize(f.size)}</td>
                  <td>{new Date(f.uploadedAt).toLocaleString()}</td>
                  <td>
                    <button onClick={()=>download(f.id)}>Download</button>
                    <button onClick={()=>del(f.id)} style={{ marginLeft: 8 }}>Delete</button>
                  </td>
                </tr>
              ))}
              {files.length===0 && <tr><td colSpan={4}>No files</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
