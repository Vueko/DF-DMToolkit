export async function saveMapImage(id: string, file: File): Promise<void> {
  const buffer = await file.arrayBuffer()
  await window.electron.fs.saveMapImage(id, buffer)
}

export async function getMapImage(id: string): Promise<string | null> {
  const data = await window.electron.fs.getMapImage(id)
  if (!data) return null
  return URL.createObjectURL(new Blob([new Uint8Array(data)]))
}

export async function deleteMapImage(id: string): Promise<void> {
  await window.electron.fs.deleteMapImage(id)
}