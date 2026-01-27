import { useCallback, useEffect, useState } from 'react';

const DEFAULT_STATUS = 'Ready for test actions.';

export default function useZSharathTestPageLogic() {
  const [selectedOption, setSelectedOption] = useState('');
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [geminiImageUrl, setGeminiImageUrl] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState(DEFAULT_STATUS);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    document.title = 'My Page';
  }, []);

  const homeUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleEmailTest = useCallback((label) => {
    setStatusMessage(`Triggered email workflow: ${label}`);
    setErrorMessage('');
  }, []);

  const handleSmsTest = useCallback((label) => {
    setStatusMessage(`Triggered SMS workflow: ${label}`);
    setErrorMessage('');
  }, []);

  const handleRawEmail = useCallback(() => {
    setStatusMessage('Triggered raw email workflow');
    setErrorMessage('');
  }, []);

  const handleOptionChange = useCallback((value) => {
    setSelectedOption(value);
    setStatusMessage(`Option set to: ${value || 'none'}`);
  }, []);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFilePreviewUrl('');
      setFileBase64('');
      setFileName('');
      return;
    }

    setFileName(file.name);
    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFileBase64(result);
      setStatusMessage('File converted to base64.');
    };
    reader.onerror = () => {
      setErrorMessage('Failed to convert file.');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGeminiTest = useCallback(() => {
    setGeminiImageUrl('/assets/images/placeholder.png');
    setStatusMessage('Triggered Gemini Nano workflow.');
  }, []);

  const handleShowPopup = useCallback(() => {
    setPopupVisible((prev) => !prev);
    setStatusMessage('Toggled popup visibility.');
  }, []);

  const handleTestLogin = useCallback(() => {
    setStatusMessage('Triggered Test Login workflow.');
  }, []);

  return {
    homeUrl,
    selectedOption,
    filePreviewUrl,
    fileBase64,
    fileName,
    geminiImageUrl,
    popupVisible,
    statusMessage,
    errorMessage,
    handleEmailTest,
    handleSmsTest,
    handleRawEmail,
    handleOptionChange,
    handleFileChange,
    handleGeminiTest,
    handleShowPopup,
    handleTestLogin
  };
}
