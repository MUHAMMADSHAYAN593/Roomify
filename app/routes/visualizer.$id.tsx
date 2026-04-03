import Button from 'components/ui/Button'
import { generate3DView } from 'lib/ai.action'
import { Box, Download, RefreshCcw, Share2, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

const visualizerId = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { initialImage, initialRender, name } = location.state || {}

  const hasInitialGenerated = useRef(false)
  const [isprocessing, setIsprocessing] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(initialRender || null)
  const handleback = () => {
    navigate('/')
  }

  const runGeneration = async () => {
    if (!initialImage) return
    try {
      setIsprocessing(true)
      const result = await generate3DView({ sourceImage: initialImage })
      if (result.renderedImage) {
        setCurrentImage(result.renderedImage)
        //update the project with the renderd image
      }
    } catch (error) {
      console.error('Generation failed', error)
    } finally {
      setIsprocessing(false)
    }
  }

  useEffect(() => {
    if (!initialImage || hasInitialGenerated.current) return
    if (initialRender) {
      setCurrentImage(initialRender)
      hasInitialGenerated.current = true
    }

    hasInitialGenerated.current = true
    runGeneration()
  }, [initialImage, initialRender])

  return (
    <div className='visualizer'>
      <nav className='topbar'>
        <div className='brand'>
          <Box className='logo' />
          <span className='name'>Roomify</span>
        </div>

        <Button variant='ghost' size='sm' onClick={handleback} className='exit'>
          <X className='icon' /> Exit Editor
        </Button>
      </nav>

      <section className='content'>
        <div className='panel'>
          <div className='panel-header'>
            <div className='panel-meta'>
              <p>Project</p>
              <h2>{'Untitled Project'}</h2>
              <p className='note'>Created By You</p>
            </div>

            <div className='panel-actions'>
              <Button 
              size='sm'
              onClick={()=>{}}
              disabled= {!currentImage}
              className='export'>
                <Download className='w-4 h-4 mr-2'/>Export
              </Button>
              <Button 
              size='sm'
              onClick={()=>{}}
              className='share'
              ><Share2 className='w-4 h-4 mr-2'/>Share</Button>
            </div>
          </div>

          <div className={`render-area ${isprocessing ? 'processing' : ''}`}>
            {currentImage ? (
              <img src={currentImage} alt='Rendered View' className='render-image' />
            ): (
              <div className='render-placholder'>
                {
                  initialImage && (
                    <img src={initialImage} alt="Original Image" className='render-fallback' />
                  )
                }
              </div>
            )}

            {
              isprocessing && (
                <div className='render-overlay'>
                  <div className='rendering-card'>
                    <RefreshCcw className='spinner'/>
                    <span className='tittle'>Rendering...</span>
                    <span className='subtittle'>Generating Your 3D visualization...</span>
                  </div>
                </div>
              )
            }
          </div>
        </div>
      </section>
    </div>
  )
}

export default visualizerId
