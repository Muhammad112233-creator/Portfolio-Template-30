import { useEffect, useRef } from 'react'

/**
 * A deliberately small WebGL sketch. Three is loaded only when this component
 * mounts, keeping the first paint light while retaining an original 3D moment.
 */
export default function OrbitCanvas() {
  const mount = useRef(null)

  useEffect(() => {
    const host = mount.current
    if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let disposed = false
    let destroy = () => {}

    const createScene = async () => {
      const THREE = await import('three')
      if (disposed) return

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
      camera.position.set(0, 0, 7)
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      host.appendChild(renderer.domElement)

      const group = new THREE.Group()
      scene.add(group)
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.24, 3), new THREE.MeshBasicMaterial({ color: 0xdfff45, wireframe: true, transparent: true, opacity: 0.9 }))
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.56, 0), new THREE.MeshBasicMaterial({ color: 0x6b86ff, wireframe: true }))
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.022, 3, 120), new THREE.MeshBasicMaterial({ color: 0xf5f1e8, transparent: true, opacity: 0.68 }))
      ring.rotation.set(1.08, 0.2, -0.35)
      group.add(orb, core, ring)

      const dots = new THREE.BufferGeometry()
      const values = new Float32Array(260 * 3)
      for (let i = 0; i < values.length; i += 3) {
        const radius = 2.2 + Math.random() * 1.5
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        values[i] = radius * Math.sin(phi) * Math.cos(theta)
        values[i + 1] = radius * Math.cos(phi)
        values[i + 2] = radius * Math.sin(phi) * Math.sin(theta)
      }
      dots.setAttribute('position', new THREE.BufferAttribute(values, 3))
      const stars = new THREE.Points(dots, new THREE.PointsMaterial({ color: 0xf5f1e8, size: 0.022, transparent: true, opacity: 0.75 }))
      group.add(stars)

      const cursor = { x: 0, y: 0 }
      const onPointer = (event) => {
        const rect = host.getBoundingClientRect()
        cursor.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
        cursor.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
      }
      host.addEventListener('pointermove', onPointer)
      const resize = () => {
        const { width, height } = host.getBoundingClientRect()
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
      const observer = new ResizeObserver(resize)
      observer.observe(host)
      resize()

      let frame
      const render = (time) => {
        group.rotation.y += 0.0035
        group.rotation.x += (cursor.y * 0.22 - group.rotation.x) * 0.025
        group.rotation.z += (cursor.x * 0.12 - group.rotation.z) * 0.025
        ring.rotation.z = time * 0.00017
        core.rotation.x -= 0.012
        core.rotation.y += 0.017
        stars.rotation.y -= 0.0008
        renderer.render(scene, camera)
        frame = requestAnimationFrame(render)
      }
      frame = requestAnimationFrame(render)

      destroy = () => {
        cancelAnimationFrame(frame)
        observer.disconnect()
        host.removeEventListener('pointermove', onPointer)
        orb.geometry.dispose(); orb.material.dispose()
        core.geometry.dispose(); core.material.dispose()
        ring.geometry.dispose(); ring.material.dispose()
        dots.dispose(); stars.material.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    }
    createScene()

    return () => { disposed = true; destroy() }
  }, [])

  return <div className="orbit-canvas" ref={mount} aria-hidden="true" />
}
