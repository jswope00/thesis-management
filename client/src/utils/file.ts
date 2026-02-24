import { UploadFileType } from '../config/types'

export function getAdjustedFileType(filename: string, type: UploadFileType) {
  const lower = filename.toLowerCase()
  let adjustedType: UploadFileType = type

  if (lower.endsWith('.pdf')) {
    adjustedType = 'pdf'
  }

  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.svg')
  ) {
    adjustedType = 'image'
  }

  if (lower.endsWith('.docx')) {
    adjustedType = 'any'
  }

  return adjustedType
}
