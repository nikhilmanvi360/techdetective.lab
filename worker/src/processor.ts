import fetch from 'node-fetch';

interface ExecutionJob {
  code: string;
  language: string;
  version?: string;
  missionId: string;
  teamId: string;
}

export async function processCodeExecution(data: ExecutionJob) {
  const { code, language, version = '*' } = data;

  const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

  try {
    const response = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: language === 'js' || language === 'javascript' ? 'javascript' : language,
        version: version,
        files: [
          {
            name: 'detective_script.js',
            content: code,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Piston API returned ${response.status}`);
    }

    const result: any = await response.json();

    return {
      success: true,
      stdout: result.run.stdout,
      stderr: result.run.stderr,
      output: result.run.output,
      code: result.run.code,
      signal: result.run.signal,
    };
  } catch (error: any) {
    console.error(`[PROCESSOR ERROR] ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}
