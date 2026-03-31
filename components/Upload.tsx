import { CheckCircle, ImageIcon, UploadIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useOutletContext } from 'react-router'
import {
    ACCEPTED_UPLOAD_EXTENSIONS,
    ACCEPTED_UPLOAD_MIME_TYPES,
    MAX_UPLOAD_FILE_SIZE_BYTES,
    MAX_UPLOAD_FILE_SIZE_MB,
    PROGRESS_INCREMENT,
    PROGRESS_INTERVAL_MS,
    PROGRESS_STEP,
    REDIRECT_DELAY_MS,
} from 'lib/constants'

type UploadProps = {
    onComplete?: (base64Data: string) => void
}

const ACCEPTED_UPLOAD_EXTENSION_SET = new Set<string>(ACCEPTED_UPLOAD_EXTENSIONS)
const ACCEPTED_UPLOAD_MIME_TYPE_SET = new Set<string>(ACCEPTED_UPLOAD_MIME_TYPES)
const ACCEPTED_UPLOAD_INPUT = ACCEPTED_UPLOAD_EXTENSIONS.join(',')

const validateFile = (file: File) => {
    const extensionIndex = file.name.lastIndexOf('.')
    const fileExtension = extensionIndex >= 0 ? file.name.slice(extensionIndex).toLowerCase() : ''
    const hasValidExtension = ACCEPTED_UPLOAD_EXTENSION_SET.has(fileExtension)
    const hasValidMimeType = file.type === '' || ACCEPTED_UPLOAD_MIME_TYPE_SET.has(file.type.toLowerCase())

    if (!hasValidExtension || !hasValidMimeType) {
        return 'Please upload a JPG or PNG floor plan.'
    }

    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
        return `Please upload a file up to ${MAX_UPLOAD_FILE_SIZE_MB}MB.`
    }

    return null
}

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [progress, setProgress] = useState(0)
    const [validationMessage, setValidationMessage] = useState<string | null>(null)
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

    const showValidationMessage = (message: string) => {
        clearPendingUpload()
        setFile(null)
        setIsDragging(false)
        resetProgress()
        setValidationMessage(message)
    }

    const processFile = (nextFile: File | null) => {
        if (!isSignedIn || !nextFile) {
            return
        }

        const validationError = validateFile(nextFile)
        if (validationError) {
            showValidationMessage(validationError)
            return
        }

        clearPendingUpload()
        setFile(nextFile)
        setIsDragging(false)
        resetProgress()
        setValidationMessage(null)

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
            setValidationMessage('We could not read that file. Please try another JPG or PNG floor plan.')
        }

        reader.readAsDataURL(nextFile)
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) {
            event.target.value = ''
            return
        }

        const nextFile = event.target.files?.[0] ?? null
        if (!nextFile) {
            event.target.value = ''
            return
        }

        const validationError = validateFile(nextFile)
        if (validationError) {
            showValidationMessage(validationError)
            event.target.value = ''
            return
        }

        processFile(nextFile)
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

        const nextFile = event.dataTransfer.files?.[0] ?? null
        if (!nextFile) {
            return
        }

        const validationError = validateFile(nextFile)
        if (validationError) {
            showValidationMessage(validationError)
            return
        }

        processFile(nextFile)
    }

  return (
    <div className='upload'>
      {
        !file ? (
            <div
                className={`dropzone ${isDragging ? 'is-dragging' : ''} ${validationMessage ? 'has-error' : ''}`}
                aria-disabled={!isSignedIn}
                aria-invalid={Boolean(validationMessage)}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input 
                type="file"
                className='drop-input'
                accept={ACCEPTED_UPLOAD_INPUT}
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
                    <p className='help'>Maximum file size {MAX_UPLOAD_FILE_SIZE_MB}MB</p>
                    {
                        validationMessage ? (
                            <p className='error' role='alert'>
                                {validationMessage}
                            </p>
                        ) : null
                    }
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
