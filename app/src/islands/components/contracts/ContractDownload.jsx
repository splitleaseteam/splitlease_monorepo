// Contract Download Component - Display result and download links

export function ContractDownload({ result }) {
  if (!result) {
    return null;
  }

  return (
    <div className="contract-download">
      <h3>Document Generated Successfully!</h3>

      <div className="download-links">
        <div className="download-link">
          <label>Download from Supabase Storage:</label>
          <a
            href={result.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="download-button primary"
            download={result.filename}
          >
            Download {result.filename}
          </a>
        </div>

        {result.driveUrl && (
          <div className="download-link">
            <label>Open in Google Drive:</label>
            <a
              href={result.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="download-button secondary"
            >
              Open in Google Drive
            </a>
          </div>
        )}
      </div>

      <div className="document-info">
        <p><strong>Filename:</strong> {result.filename}</p>
        {result.driveFileId && (
          <p><strong>Google Drive File ID:</strong> {result.driveFileId}</p>
        )}
      </div>
    </div>
  );
}
