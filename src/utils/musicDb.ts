export async function saveTrackFile(id: string, file: File): Promise<void> {
  const buffer = await file.arrayBuffer()
  await window.electron.fs.saveAudio(id, buffer)
}

export async function getTrackUrl(id: string): Promise<string | null> {
  const data = await window.electron.fs.getAudio(id)
  if (!data) return null
  return URL.createObjectURL(new Blob([new Uint8Array(data)]))
}

export async function deleteTrackFile(id: string): Promise<void> {
  await window.electron.fs.deleteAudio(id)
}