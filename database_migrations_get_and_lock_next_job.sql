-- Function: get_and_lock_next_job
-- Description: Retrieves the next pending processing job, locks it, and updates its status to 'running'.

CREATE OR REPLACE FUNCTION get_and_lock_next_job()
RETURNS TABLE(
    id UUID,
    user_id UUID,
    status TEXT,
    source_id UUID,
    job_type_id INT,
    parameters JSONB,
    progress INT,
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    job_type_name TEXT
) AS $$
DECLARE
    _job_id UUID;
BEGIN
    -- Find and lock the next pending job
    SELECT
        pj.id
    INTO
        _job_id
    FROM
        processing_jobs pj
    WHERE
        pj.status = 'pending'
    ORDER BY
        pj.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF _job_id IS NULL THEN
        RETURN; -- No pending jobs found
    END IF;

    -- Update the job status to 'running'
    UPDATE
        processing_jobs
    SET
        status = 'running',
        started_at = NOW()
    WHERE
        id = _job_id;

    -- Return the locked and updated job with its job_type_name
    RETURN QUERY
    SELECT
        pj.id,
        pj.user_id,
        pj.status,
        pj.source_id,
        pj.job_type_id,
        pj.parameters,
        pj.progress,
        pj.result,
        pj.error_message,
        pj.started_at,
        pj.completed_at,
        pj.created_at,
        jt.name AS job_type_name
    FROM
        processing_jobs pj
    JOIN
        job_types jt ON pj.job_type_id = jt.id
    WHERE
        pj.id = _job_id;

END;
$$ LANGUAGE plpgsql;

-- Grant execution rights to the service role (assuming 'supabase_admin' or similar)
-- You might need to adjust the role based on your Supabase setup.
-- For typical Supabase projects, the `service_role` key uses the `supabase_admin` role.
GRANT EXECUTE ON FUNCTION get_and_lock_next_job() TO service_role;
