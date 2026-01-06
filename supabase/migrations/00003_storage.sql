-- ============================================================================
-- MATHPIVOT TUTOROS - STORAGE CONFIGURATION
-- Migration 00003: Storage buckets and policies
-- ============================================================================

-- Create the session-attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'session-attachments',
    'session-attachments',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for session-attachments bucket

-- Allow authenticated users to upload to session-attachments
CREATE POLICY "session_attachments_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'session-attachments'
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.sessions s
            JOIN public.bookings b ON b.id = s.booking_id
            WHERE s.id = (storage.foldername(name))[1]::uuid
              AND (b.tutor_user_id = auth.uid() OR b.student_user_id = auth.uid())
        )
    )
);

-- Allow access to own session attachments
CREATE POLICY "session_attachments_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'session-attachments'
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.sessions s
            JOIN public.bookings b ON b.id = s.booking_id
            WHERE s.id = (storage.foldername(name))[1]::uuid
              AND (
                  b.tutor_user_id = auth.uid()
                  OR b.student_user_id = auth.uid()
                  OR b.parent_user_id = auth.uid()
                  OR public.is_parent_in_family(b.family_id)
              )
        )
    )
);

-- Allow deletion by uploader or admin
CREATE POLICY "session_attachments_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'session-attachments'
    AND (
        public.is_admin()
        OR owner = auth.uid()
    )
);
