export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private stream: MediaStream | null = null

  async start(stream: MediaStream): Promise<void> {
    this.stream = stream
    this.recordedChunks = []

    const options: MediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp9',
    }

    // Fallback to other codecs if vp9 is not supported
    if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
      options.mimeType = 'video/webm;codecs=vp8'
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'video/webm'
      }
    }

    this.mediaRecorder = new MediaRecorder(stream, options)

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data)
      }
    }

    this.mediaRecorder.start()
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not started'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' })
        resolve(blob)
      }

      this.mediaRecorder.onerror = (error) => {
        reject(error)
      }

      this.mediaRecorder.stop()
    })
  }

  async getStream(): Promise<MediaStream | null> {
    return this.stream
  }
}
