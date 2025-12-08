import { google } from 'googleapis'

export function getAuthUrl(clientId: string, clientSecret: string, redirectUri: string) {
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  )

  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata'
  ]

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  })
}

export async function getTokensFromCode(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  )
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function uploadVideoToDrive(
  clientId: string,
  clientSecret: string,
  accessToken: string,
  refreshToken: string,
  videoBuffer: Buffer,
  fileName: string,
  mimeType: string = 'video/webm'
) {
  const { Readable } = require('stream')
  
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })

  const fileMetadata = {
    name: fileName,
    mimeType: mimeType
  }

  // Convertir Buffer a Readable stream
  const bufferStream = Readable.from(videoBuffer)

  const media = {
    mimeType: mimeType,
    body: bufferStream
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink'
  })

  // Make file publicly accessible
  await drive.permissions.create({
    fileId: response.data.id!,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  })

  return {
    fileId: response.data.id,
    webViewLink: response.data.webViewLink,
    webContentLink: response.data.webContentLink
  }
}

export async function deleteFileFromDrive(
  clientId: string,
  clientSecret: string,
  accessToken: string,
  refreshToken: string,
  fileId: string
) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })

  await drive.files.delete({
    fileId: fileId
  })
}

export async function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}
