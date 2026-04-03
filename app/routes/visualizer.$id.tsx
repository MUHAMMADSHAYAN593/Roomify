import Button from 'components/ui/Button'
import { generate3DView } from 'lib/ai.action'
import { createProject, getProjectById } from 'lib/puter.actions'
import { Box, Download, RefreshCcw, Share2, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router'

const visualizerId = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = (location.state as VisualizerLocationState | null) ?? null
  const { userId } = useOutletContext<AuthContext>()
  const initialSourceImage = locationState?.initialImage || null
  const initialRenderedImage = locationState?.initialRender || null

  const hasInitialGenerated = useRef(false)
  const [project, setProject] = useState<DesignItem | null>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [isprocessing, setIsprocessing] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const displaySourceImage = initialSourceImage || project?.sourceImage || null

  const handleback = () => {
    navigate('/')
  }

  const handleExport = () => {
    if (!currentImage || typeof document === 'undefined') return

    const downloadLink = document.createElement('a')
    const downloadName = (project?.name || `Residence ${id}` || 'roomify-render')
      .trim()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')

    downloadLink.href = currentImage
    downloadLink.download = `${downloadName || 'roomify-render'}.png`
    downloadLink.rel = 'noopener'

    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const runGeneration = async (item: DesignItem) => {
    if (!id || !item.sourceImage) return
    try {
      setIsprocessing(true)
      const result = await generate3DView({ sourceImage: item.sourceImage })
      if (result.renderedImage) {
        setCurrentImage(result.renderedImage)
        //update the project with the renderd image

        const updatedItem = {
          ...item,
          renderedImage: result.renderedImage,
          renderedPath: result.renderedPath,
          timestamp: Date.now(),
          ownerId: item.ownerId ?? userId ?? null,
          isPublic: item.isPublic ?? false,
        }

        const saved = await createProject({ item: updatedItem, visibility: "private" })

        if (saved) {
          setProject(saved)
          setCurrentImage(saved.renderedImage || result.renderedImage || null)
        }


      }
    } catch (error) {
      console.error('Generation failed', error)
    } finally {
      setIsprocessing(false)
    }
  }

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) {
        setProjectLoading(false);
        return;
      }

      setProjectLoading(true);

      const fetchedProject = await getProjectById({ id });

      if (!isMounted) return;

      if (fetchedProject) {
        setProject({
          ...fetchedProject,
          sourceImage: initialSourceImage || fetchedProject.sourceImage,
          renderedImage: fetchedProject.renderedImage || initialRenderedImage,
          name: fetchedProject.name || locationState?.name || null,
        });
      } else if (initialSourceImage) {
        setProject({
          id,
          name: locationState?.name || `Residence ${id}`,
          sourceImage: initialSourceImage,
          renderedImage: initialRenderedImage,
          timestamp: Date.now(),
          ownerId: userId ?? null,
        });
      } else {
        setProject(null);
      }

      setCurrentImage(fetchedProject?.renderedImage || initialRenderedImage || null);
      setProjectLoading(false);
      hasInitialGenerated.current = false;
    };

    void loadProject();

    return () => {
      isMounted = false;
    };
  }, [id, initialRenderedImage, initialSourceImage, locationState?.name, userId]);

  useEffect(() => {
    const generationSourceImage = initialSourceImage || project?.sourceImage || null;

    if (
      projectLoading ||
      hasInitialGenerated.current ||
      !project ||
      !generationSourceImage
    )
      return;

    if (project.renderedImage || initialRenderedImage) {
      setCurrentImage(project.renderedImage || initialRenderedImage);
      hasInitialGenerated.current = true;
      return;
    }

    hasInitialGenerated.current = true;
    void runGeneration({
      ...project,
      sourceImage: generationSourceImage,
    });
  }, [initialRenderedImage, initialSourceImage, project, projectLoading]);

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
              <h2>{project?.name || `Residence ${id}`}</h2>
              <p className='note'>Created By You</p>
            </div>

            <div className='panel-actions'>
              <Button
                size='sm'
                onClick={handleExport}
                disabled={!currentImage}
                className='export'>
                <Download className='w-4 h-4 mr-2' />Export
              </Button>
              <Button
                size='sm'
                onClick={() => { }}
                className='share'
              ><Share2 className='w-4 h-4 mr-2' />Share</Button>
            </div>
          </div>

          <div className={`render-area ${isprocessing ? 'is-processing' : ''}`}>
            {currentImage ? (
              <img src={currentImage} alt='Rendered View' className='render-img' />
            ) : (
              <div className='render-placeholder'>
                {
                  displaySourceImage && (
                    <img src={displaySourceImage} alt="Original Image" className='render-fallback' />
                  )
                }
              </div>
            )}

            {
              isprocessing && (
                <div className='render-overlay'>
                  <div className='rendering-card'>
                    <RefreshCcw className='spinner' />
                    <span className='title'>Rendering...</span>
                    <span className='subtitle'>Generating Your 3D visualization...</span>
                  </div>
                </div>
              )
            }
          </div>
        </div>

        <div className='panel compare'>
          <div className='panel-header'>
            <div className='panel-meta'>
              <p>Comparison</p>
              <h3>Before and After</h3>
            </div>
            <div className='hint'>Drag to Compare</div>
          </div>

          <div className='compare-stage'>
            {
              project?.sourceImage && currentImage ? (
                <ReactCompareSlider
                defaultValue={50}
                style={{width: '100%' , height: '100%'}}
                itemOne= {
                  <ReactCompareSliderImage src={project?.sourceImage} alt='before' className='compare-img'/>
                }
                itemTwo= {
                  <ReactCompareSliderImage src={currentImage || project?.renderedImage || ''} alt='after' className='compare-img'/>
                }
                 />
              ) : (
                <div className='compare-fallback'>
                  {
                    project?.sourceImage && (
                      <img src={project.sourceImage} alt="Original Image" className='compare-img' />
                    )
                  }
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
