/**
 * Google Classroom Integration for MathPivot TutorOS
 * Syncs assignments and materials with Google Classroom
 */
import { google, classroom_v1 } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
];

/**
 * Create authenticated Classroom client
 */
export function createClassroomClient(
  accessToken: string,
  refreshToken?: string
): classroom_v1.Classroom {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.classroom({ version: 'v1', auth: oauth2Client });
}

/**
 * Get OAuth scopes for Classroom
 */
export function getClassroomScopes(): string[] {
  return SCOPES;
}

/**
 * List courses the user has access to
 */
export async function listCourses(
  accessToken: string,
  refreshToken: string
): Promise<classroom_v1.Schema$Course[]> {
  try {
    const classroom = createClassroomClient(accessToken, refreshToken);

    const response = await classroom.courses.list({
      courseStates: ['ACTIVE'],
    });

    return response.data.courses || [];
  } catch (error) {
    console.error('Failed to list courses:', error);
    return [];
  }
}

/**
 * Get course details
 */
export async function getCourse(
  accessToken: string,
  refreshToken: string,
  courseId: string
): Promise<classroom_v1.Schema$Course | null> {
  try {
    const classroom = createClassroomClient(accessToken, refreshToken);

    const response = await classroom.courses.get({
      id: courseId,
    });

    return response.data;
  } catch (error) {
    console.error('Failed to get course:', error);
    return null;
  }
}

/**
 * List students in a course
 */
export async function listStudents(
  accessToken: string,
  refreshToken: string,
  courseId: string
): Promise<classroom_v1.Schema$Student[]> {
  try {
    const classroom = createClassroomClient(accessToken, refreshToken);

    const response = await classroom.courses.students.list({
      courseId,
    });

    return response.data.students || [];
  } catch (error) {
    console.error('Failed to list students:', error);
    return [];
  }
}

/**
 * Create an assignment in Google Classroom
 */
export async function createAssignment(
  accessToken: string,
  refreshToken: string,
  courseId: string,
  assignment: {
    title: string;
    description?: string;
    dueDate?: Date;
    dueTime?: string; // HH:mm format
    maxPoints?: number;
    materials?: Array<{
      driveFileId?: string;
      link?: string;
      title?: string;
    }>;
  }
): Promise<{ courseWorkId: string; alternateLink: string } | null> {
  try {
    const classroom = createClassroomClient(accessToken, refreshToken);

    const materials: classroom_v1.Schema$Material[] = [];

    if (assignment.materials) {
      for (const m of assignment.materials) {
        if (m.driveFileId) {
          materials.push({
            driveFile: {
              driveFile: { id: m.driveFileId, title: m.title },
              shareMode: 'STUDENT_COPY',
            },
          });
        } else if (m.link) {
          materials.push({
            link: { url: m.link, title: m.title },
          });
        }
      }
    }

    const courseWork: classroom_v1.Schema$CourseWork = {
      title: assignment.title,
      description: assignment.description,
      workType: 'ASSIGNMENT',
      state: 'PUBLISHED',
      maxPoints: assignment.maxPoints || 100,
      materials: materials.length > 0 ? materials : undefined,
    };

    if (assignment.dueDate) {
      const due = assignment.dueDate;
      courseWork.dueDate = {
        year: due.getFullYear(),
        month: due.getMonth() + 1,
        day: due.getDate(),
      };

      if (assignment.dueTime) {
        const [hours, minutes] = assignment.dueTime.split(':').map(Number);
        courseWork.dueTime = { hours, minutes };
      }
    }

    const response = await classroom.courses.courseWork.create({
      courseId,
      requestBody: courseWork,
    });

    if (!response.data.id) return null;

    return {
      courseWorkId: response.data.id,
      alternateLink: response.data.alternateLink || '',
    };
  } catch (error) {
    console.error('Failed to create assignment:', error);
    return null;
  }
}

/**
 * List coursework/assignments in a course
 */
export async function listAssignments(
  accessToken: string,
  refreshToken: string,
  courseId: string
): Promise<classroom_v1.Schema$CourseWork[]> {
  try {
    const classroom = createClassroomClient(accessToken, refreshToken);

    const response = await classroom.courses.courseWork.list({
      courseId,
      orderBy: 'dueDate desc',
    });

    return response.data.courseWork || [];
  } catch (error) {
    console.error('Failed to list assignments:', error);
    return [];
  }
}

/**
 * Get student submissions for an assignment
 */
export async function getStudentSubmissions(
  accessToken: string,
  refreshToken: string,
  courseId: string,
  courseWorkId: string
): Promise<classroom_v1.Schema$StudentSubmission[]> {
  try {
    const classroom = createClassroomClient(accessToken, refreshToken);

    const response = await classroom.courses.courseWork.studentSubmissions.list({
      courseId,
      courseWorkId,
    });

    return response.data.studentSubmissions || [];
  } catch (error) {
    console.error('Failed to get submissions:', error);
    return [];
  }
}

/**
 * Grade a student submission
 */
export async function gradeSubmission(
  accessToken: string,
  refreshToken: string,
  courseId: string,
  courseWorkId: string,
  submissionId: string,
  grade: {
    assignedGrade: number;
    draftGrade?: number;
  }
): Promise<boolean> {
  try {
    const classroom = createClassroomClient(accessToken, refreshToken);

    await classroom.courses.courseWork.studentSubmissions.patch({
      courseId,
      courseWorkId,
      id: submissionId,
      updateMask: 'assignedGrade,draftGrade',
      requestBody: {
        assignedGrade: grade.assignedGrade,
        draftGrade: grade.draftGrade,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to grade submission:', error);
    return false;
  }
}

/**
 * Return a graded submission to student
 */
export async function returnSubmission(
  accessToken: string,
  refreshToken: string,
  courseId: string,
  courseWorkId: string,
  submissionId: string
): Promise<boolean> {
  try {
    const classroom = createClassroomClient(accessToken, refreshToken);

    await classroom.courses.courseWork.studentSubmissions.return({
      courseId,
      courseWorkId,
      id: submissionId,
    });

    return true;
  } catch (error) {
    console.error('Failed to return submission:', error);
    return false;
  }
}

/**
 * Create a MathPivot announcement in Classroom
 */
export async function createAnnouncement(
  accessToken: string,
  refreshToken: string,
  courseId: string,
  text: string,
  materials?: Array<{ link?: string; driveFileId?: string; title?: string }>
): Promise<{ announcementId: string } | null> {
  try {
    const classroom = createClassroomClient(accessToken, refreshToken);

    const announcementMaterials: classroom_v1.Schema$Material[] = [];

    if (materials) {
      for (const m of materials) {
        if (m.driveFileId) {
          announcementMaterials.push({
            driveFile: { driveFile: { id: m.driveFileId, title: m.title } },
          });
        } else if (m.link) {
          announcementMaterials.push({
            link: { url: m.link, title: m.title },
          });
        }
      }
    }

    const response = await classroom.courses.announcements.create({
      courseId,
      requestBody: {
        text,
        state: 'PUBLISHED',
        materials: announcementMaterials.length > 0 ? announcementMaterials : undefined,
      },
    });

    if (!response.data.id) return null;

    return { announcementId: response.data.id };
  } catch (error) {
    console.error('Failed to create announcement:', error);
    return null;
  }
}

/**
 * Sync MathPivot homework to Google Classroom
 */
export async function syncHomeworkToClassroom(
  accessToken: string,
  refreshToken: string,
  courseId: string,
  homework: {
    title: string;
    description: string;
    dueDate?: Date;
    driveFileId?: string;
    maxPoints?: number;
  }
): Promise<{ courseWorkId: string } | null> {
  const result = await createAssignment(accessToken, refreshToken, courseId, {
    title: `[MathPivot] ${homework.title}`,
    description: homework.description,
    dueDate: homework.dueDate,
    maxPoints: homework.maxPoints || 100,
    materials: homework.driveFileId
      ? [{ driveFileId: homework.driveFileId, title: homework.title }]
      : undefined,
  });

  return result ? { courseWorkId: result.courseWorkId } : null;
}
