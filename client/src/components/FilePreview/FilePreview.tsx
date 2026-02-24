import { AspectRatio, Group, Text } from '@mantine/core'
import { useEffect, useMemo, useRef } from 'react'
import { UploadFileType } from '../../config/types'
import { File } from 'phosphor-react'
import { getAdjustedFileType } from '../../utils/file'
import { renderAsync } from 'docx-preview'

interface IFilePreviewProps {
  file: File
  type: UploadFileType
  aspectRatio?: number
}

const FilePreview = (props: IFilePreviewProps) => {
  const { file, type, aspectRatio = 16 / 9 } = props

  const adjustedType = getAdjustedFileType(file.name, type)
  const isDocx = adjustedType === 'any' && file.name.toLowerCase().endsWith('.docx')

  const docxContainerRef = useRef<HTMLDivElement>(null)

  const url = useMemo(() => {
    if (adjustedType === 'pdf') {
      return `${URL.createObjectURL(file)}#toolbar=0&navpanes=0`
    }

    return URL.createObjectURL(file)
  }, [file, adjustedType])

  useEffect(() => {
    if (isDocx && docxContainerRef.current) {
      docxContainerRef.current.innerHTML = ''
      renderAsync(file, docxContainerRef.current, undefined, {
        inWrapper: false,
        ignoreWidth: true,
      }).catch(console.error)
    }
  }, [file, isDocx])

  return (
    <AspectRatio ratio={aspectRatio}>
      {adjustedType === 'pdf' && <iframe style={{ border: 0 }} src={url} />}
      {adjustedType === 'image' && <img alt={file.name} src={url} />}
      {isDocx && (
        <div
          ref={docxContainerRef}
          style={{ width: '100%', height: '100%', overflow: 'auto', padding: '0 8px', backgroundColor: 'white' }}
        />
      )}
      {adjustedType === 'any' && !isDocx && (
        <Group>
          <File />
          <Text>{file.name}</Text>
        </Group>
      )}
    </AspectRatio>
  )
}

export default FilePreview
