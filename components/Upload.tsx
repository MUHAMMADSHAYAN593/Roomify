import { CheckCircle, ImageIcon, UploadIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useOutletContext } from 'react-router'
import {
    PROGRESS_INCREMENT,
    PROGRESS_INTERVAL_MS,
    PROGRESS_STEP,
    REDIRECT_DELAY_MS,
} from 'lib/constants'

type UploadProps = {
    onComplete?: (base64Data: string) => void
}

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [progress, setProgress] = useState(0)
    const progressRef = useRef(0)
    const progressIntervalRef = useRef<number | null>(null)
    const redirectTimeoutRef = useRef<number | null>(null)
    const fileReaderRef = useRef<FileReader | null>(null)

    const { isSignedIn } = useOutletContext<AuthContext>()

    const clearPendingUpload = () => {
        if (progressIntervalRef.current !== null) {
            window.clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
        }

        if (redirectTimeoutRef.current !== null) {
            window.clearTimeout(redirectTimeoutRef.current)
            redirectTimeoutRef.current = null
        }

        if (fileReaderRef.current?.readyState === FileReader.LOADING) {
            fileReaderRef.current.abort()
        }

        fileReaderRef.current = null
    }

    useEffect(() => {
        return () => {
            clearPendingUpload()
        }
    }, [])

    const resetProgress = () => {
        progressRef.current = 0
        setProgress(0)
    }

    const processFile = (files: FileList | null) => {
        if (!isSignedIn || !files?.length) {
            return
        }

        const nextFile = files[0]

        clearPendingUpload()
        setFile(nextFile)
        setIsDragging(false)
        resetProgress()

        const reader = new FileReader()
        fileReaderRef.current = reader

        reader.onload = () => {
            fileReaderRef.current = null

            if (typeof reader.result !== 'string') {
                setFile(null)
                resetProgress()
                return
            }

            const base64Data = reader.result
            progressRef.current = PROGRESS_STEP
            setProgress(PROGRESS_STEP)

            progressIntervalRef.current = window.setInterval(() => {
                progressRef.current = Math.min(progressRef.current + PROGRESS_INCREMENT, 100)
                setProgress(progressRef.current)

                if (progressRef.current < 100) {
                    return
                }

                if (progressIntervalRef.current !== null) {
                    window.clearInterval(progressIntervalRef.current)
                    progressIntervalRef.current = null
                }

                redirectTimeoutRef.current = window.setTimeout(() => {
                    onComplete?.(base64Data)
                }, REDIRECT_DELAY_MS)
            }, PROGRESS_INTERVAL_MS)
        }

        reader.onerror = () => {
            fileReaderRef.current = null
            setFile(null)
            resetProgress()
        }

        reader.readAsDataURL(nextFile)
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) {
            event.target.value = ''
            return
        }

        processFile(event.target.files)
        event.target.value = ''
    }

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()

        if (!isSignedIn) {
            return
        }

        setIsDragging(true)
    }

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()

        if (!isSignedIn) {
            return
        }

        setIsDragging(true)
    }

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()

        const relatedTarget = event.relatedTarget
        if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
            return
        }

        setIsDragging(false)
    }

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragging(false)

        if (!isSignedIn) {
            return
        }

        processFile(event.dataTransfer.files)
    }

  return (
    <div className='upload'>
      {
        !file ? (
            <div
                className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                aria-disabled={!isSignedIn}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input 
                type="file"
                className='drop-input'
                accept='.jpg,.jpeg,.png'
                disabled={!isSignedIn}
                onChange={handleFileChange}
                 />

                 <div className='drop-content'>
                    <div className='drop-icon'>
                        <UploadIcon size={20}/>
                    </div>
                    <p>
                        {
                            isSignedIn ? (
                                "Click to Upload or just drag and drop"
                            ) : (
                                "Sign in or Sign up with puter to upload"
                            )
                        }
                    </p>
                    <p className='help'>Maximum file size 50MB</p>
                 </div>
            </div>
        ) : (
            <div className='upload-status'>
                <div className='status-content'>
                    <div className='status-icon'>
                        {
                            progress === 100 ? (
                                <CheckCircle className='check'/>
                            ) : (
                                <ImageIcon className='image'/>
                            )
                        }
                    </div>

                    <h3>{file.name}</h3>

                    <div className='progress'>
                        <div className='bar' style={{ width: `${progress}%`}}/>
                        <p className='status-text'>
                            {
                                progress < 100 ? 'Analyzing Floor plan...' : 'Redirecting...'
                            }
                        </p>
                    </div>
                </div>
            </div>
        )
      }
    </div>
  )
}

export default Upload
