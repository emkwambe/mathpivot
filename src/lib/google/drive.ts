/**
 * Google Drive Integration for MathPivot TutorOS
 * Manages homework files, worksheets, and session materials
 */
import { google, drive_v3 } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

/**
 * Create authenticated Drive client
 */
export function createDriveClient(
  accessToken: string,
  refreshToken?: string
): drive_v3.Drive {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Get OAuth scopes for Drive
 */
export function getDriveScopes(): string[] {
  return SCOPES;
}

/**
 * Create MathPivot folder structure for a student
 */
export async function createStudentFolder(
  accessToken: string,
  refreshToken: string,
  studentName: string,
  studentId: string
): Promise<{ folderId: string } | null> {
  try {
    const drive = createDriveClient(accessToken, refreshToken);

    // Create main student folder
    const folderResponse = await drive.files.create({
      requestBody: {
        name: `MathPivot - ${studentName}`,
        mimeType: 'application/vnd.google-apps.folder',
        description: `MathPivot tutoring materials for ${studentName} (ID: ${studentId})`,
      },
      fields: 'id',
    });

    const folderId = folderResponse.data.id;
    if (!folderId) return null;

    // Create subfolders
    const subfolders = ['Homework', 'Session Notes', 'Practice Worksheets', 'Assessments'];

    await Promise.all(
      subfolders.map((name) =>
        drive.files.create({
          requestBody: {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [folderId],
          },
        })
      )
    );

    return { folderId };
  } catch (error) {
    console.error('Failed to create student folder:', error);
    return null;
  }
}

/**
 * Upload a file to Drive
 */
export async function uploadFile(
  accessToken: string,
  refreshToken: string,
  params: {
    name: string;
    content: Buffer | string;
    mimeType: string;
    parentFolderId?: string;
    description?: string;
  }
): Promise<{ fileId: string; webViewLink: string } | null> {
  try {
    const drive = createDriveClient(accessToken, refreshToken);

    const response = await drive.files.create({
      requestBody: {
        name: params.name,
        description: params.description,
        parents: params.parentFolderId ? [params.parentFolderId] : undefined,
      },
      media: {
        mimeType: params.mimeType,
        body: typeof params.content === 'string' ? params.content : Buffer.from(params.content),
      },
      fields: 'id, webViewLink',
    });

    if (!response.data.id) return null;

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink || '',
    };
  } catch (error) {
    console.error('Failed to upload file:', error);
    return null;
  }
}

/**
 * Share a file with specific users
 */
export async function shareFile(
  accessToken: string,
  refreshToken: string,
  fileId: string,
  emails: string[],
  role: 'reader' | 'commenter' | 'writer' = 'reader'
): Promise<boolean> {
  try {
    const drive = createDriveClient(accessToken, refreshToken);

    await Promise.all(
      emails.map((email) =>
        drive.permissions.create({
          fileId,
          requestBody: {
            type: 'user',
            role,
            emailAddress: email,
          },
          sendNotificationEmail: true,
        })
      )
    );

    return true;
  } catch (error) {
    console.error('Failed to share file:', error);
    return false;
  }
}

/**
 * List files in a folder
 */
export async function listFilesInFolder(
  accessToken: string,
  refreshToken: string,
  folderId: string
): Promise<drive_v3.Schema$File[]> {
  try {
    const drive = createDriveClient(accessToken, refreshToken);

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc',
    });

    return response.data.files || [];
  } catch (error) {
    console.error('Failed to list files:', error);
    return [];
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  accessToken: string,
  refreshToken: string,
  fileId: string
): Promise<drive_v3.Schema$File | null> {
  try {
    const drive = createDriveClient(accessToken, refreshToken);

    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, webViewLink, webContentLink, size, createdTime, modifiedTime',
    });

    return response.data;
  } catch (error) {
    console.error('Failed to get file metadata:', error);
    return null;
  }
}

/**
 * Delete a file
 */
export async function deleteFile(
  accessToken: string,
  refreshToken: string,
  fileId: string
): Promise<boolean> {
  try {
    const drive = createDriveClient(accessToken, refreshToken);
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

/**
 * Create a Google Doc for session notes
 */
export async function createSessionNotesDoc(
  accessToken: string,
  refreshToken: string,
  params: {
    sessionId: string;
    studentName: string;
    tutorName: string;
    date: string;
    parentFolderId?: string;
  }
): Promise<{ docId: string; webViewLink: string } | null> {
  try {
    const drive = createDriveClient(accessToken, refreshToken);

    const response = await drive.files.create({
      requestBody: {
        name: `Session Notes - ${params.studentName} - ${params.date}`,
        mimeType: 'application/vnd.google-apps.document',
        parents: params.parentFolderId ? [params.parentFolderId] : undefined,
        description: `Session notes for ${params.studentName} with ${params.tutorName} on ${params.date}. Session ID: ${params.sessionId}`,
      },
      fields: 'id, webViewLink',
    });

    if (!response.data.id) return null;

    return {
      docId: response.data.id,
      webViewLink: response.data.webViewLink || '',
    };
  } catch (error) {
    console.error('Failed to create session notes doc:', error);
    return null;
  }
}

/**
 * Copy a template worksheet for a student
 */
export async function copyWorksheetTemplate(
  accessToken: string,
  refreshToken: string,
  templateFileId: string,
  newName: string,
  destinationFolderId?: string
): Promise<{ fileId: string; webViewLink: string } | null> {
  try {
    const drive = createDriveClient(accessToken, refreshToken);

    const response = await drive.files.copy({
      fileId: templateFileId,
      requestBody: {
        name: newName,
        parents: destinationFolderId ? [destinationFolderId] : undefined,
      },
      fields: 'id, webViewLink',
    });

    if (!response.data.id) return null;

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink || '',
    };
  } catch (error) {
    console.error('Failed to copy worksheet template:', error);
    return null;
  }
}
