const CHUNK_SIZE = 1024 * 50; // 50 KB chunks (same as original)


export const chunkString = (str, size = CHUNK_SIZE) => {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
        chunks.push(str.substring(i, i + size));
    }
    return chunks;
};


export const generateUploadId = () => {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};


export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};


export const uploadChunkedData = async (data, onProgress, apiUrl = '') => {
    const uploadId = generateUploadId();
    const jsonString = JSON.stringify(data);
    const chunks = chunkString(jsonString, CHUNK_SIZE);
    const totalChunks = chunks.length;


    console.log(`Starting upload: ${uploadId}, Total chunks: ${totalChunks}, Total Size: ${(jsonString.length / 1024).toFixed(2)} KB`);


    let receivedChunks = [];
    try {
        const statusRes = await fetch(`${apiUrl}/upload-status?uploadId=${uploadId}`);
        if (statusRes.ok) {
            const status = await statusRes.json();
            receivedChunks = status.receivedChunks || [];
        }
    } catch (err) {
        console.log('No previous upload found, starting fresh');
    }


    for (let i = 0; i < chunks.length; i++) {
        if (receivedChunks.includes(i)) {
            onProgress(((i + 1) / totalChunks) * 100);
            continue;
        }


        const chunkPacket = {
            uploadId,
            chunkIndex: i,
            totalChunks,
            payload: chunks[i]
        };


        let success = false;
        let retries = 0;
        const maxRetries = 3;


        while (!success && retries < maxRetries) {
            try {
                const response = await fetch(`${apiUrl}/upload-chunk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(chunkPacket)
                });


                if (response.ok) {
                    success = true;
                    onProgress(((i + 1) / totalChunks) * 100);
                } else {
                    throw new Error(`Server returned ${response.status}`);
                }
            } catch (error) {
                retries++;
                console.error(`Chunk ${i} failed (attempt ${retries}):`, error);
                if (retries >= maxRetries) {
                    throw new Error(`Failed to upload chunk ${i} after ${maxRetries} attempts`);
                }
                await new Promise(resolve => setTimeout(resolve, 500 * retries));
            }
        }
    }


    return uploadId;
};