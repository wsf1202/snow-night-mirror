/**
 * Robust camera open for desktop + mobile.
 * Strict facingMode:'user' often throws NotFoundError on desktop webcams.
 */

export async function openCamera(videoEl) {
  if (!window.isSecureContext) {
    const err = new Error('需要 HTTPS 或 localhost 才能使用摄像头')
    err.name = 'SecurityError'
    throw err
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    const err = new Error('当前浏览器不支持摄像头接口')
    err.name = 'NotSupportedError'
    throw err
  }

  // Warm permission + labels (ignore failures)
  try {
    const warm = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    warm.getTracks().forEach((t) => t.stop())
  } catch {
    /* continue with progressive constraints */
  }

  const devices = await listVideoInputs()
  const preferred = pickPreferredDevice(devices)

  const attempts = []
  if (preferred) {
    attempts.push({
      video: {
        deviceId: { exact: preferred.deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    })
    attempts.push({
      video: { deviceId: { exact: preferred.deviceId } },
      audio: false,
    })
  }

  // Soft facingMode (ideal, not exact) — ok on phones, ignored-ish on many desktops
  attempts.push({
    video: {
      facingMode: { ideal: 'user' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  })
  attempts.push({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  })
  attempts.push({ video: true, audio: false })

  let lastErr = null
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      await attachStream(videoEl, stream)
      return {
        stream,
        deviceLabel: stream.getVideoTracks()[0]?.label || preferred?.label || '摄像头',
        deviceCount: devices.length,
      }
    } catch (err) {
      lastErr = err
    }
  }

  // Enrich NotFound with enumerate hint
  if (lastErr && (lastErr.name === 'NotFoundError' || /Requested device not found/i.test(lastErr.message || ''))) {
    const detail = new Error(
      devices.length === 0
        ? '浏览器未枚举到任何摄像头设备。请确认系统已识别摄像头，并允许本站点使用。'
        : `已发现 ${devices.length} 个摄像头，但均无法打开。请检查是否被其他应用占用。`,
    )
    detail.name = 'NotFoundError'
    detail.cause = lastErr
    detail.devices = devices
    throw detail
  }
  throw lastErr || new Error('无法打开摄像头')
}

export async function listVideoInputs() {
  try {
    const all = await navigator.mediaDevices.enumerateDevices()
    return all.filter((d) => d.kind === 'videoinput')
  } catch {
    return []
  }
}

function pickPreferredDevice(devices) {
  if (!devices.length) return null
  const scored = devices.map((d) => {
    const label = (d.label || '').toLowerCase()
    let score = 0
    if (/front|user|facetime|integrated|内置|前置/.test(label)) score += 3
    if (/back|rear|environment|后置/.test(label)) score -= 2
    if (/virtual|obs|iriun|epoccam|manycam/.test(label)) score -= 1
    return { d, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].d
}

async function attachStream(videoEl, stream) {
  videoEl.srcObject = stream
  videoEl.muted = true
  videoEl.playsInline = true
  videoEl.setAttribute('playsinline', '')
  videoEl.setAttribute('webkit-playsinline', '')
  // Wait for metadata so MediaPipe gets non-zero dimensions
  if (videoEl.readyState < 1) {
    await new Promise((resolve, reject) => {
      const onMeta = () => {
        cleanup()
        resolve()
      }
      const onErr = () => {
        cleanup()
        reject(new Error('视频流加载失败'))
      }
      const cleanup = () => {
        videoEl.removeEventListener('loadedmetadata', onMeta)
        videoEl.removeEventListener('error', onErr)
      }
      videoEl.addEventListener('loadedmetadata', onMeta)
      videoEl.addEventListener('error', onErr)
    })
  }
  try {
    await videoEl.play()
  } catch {
    // Autoplay may be blocked briefly; muted+playsinline usually ok after gesture
  }
}
