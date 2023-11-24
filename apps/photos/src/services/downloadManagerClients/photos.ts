import HTTPService from '@ente/shared/network/HTTPService';
import { getFileURL, getThumbnailURL } from '@ente/shared/network/api';
import { EnteFile } from 'types/file';
import { DownloadClient } from 'services/downloadManager';
import { CustomError } from '@ente/shared/error';
import { retryAsyncFunction } from 'utils/network';

export class PhotosDownloadClient implements DownloadClient {
    constructor(private token: string, private timeout) {}
    updateTokens(token: string) {
        this.token = token;
    }

    updateTimeout(timeout: number) {
        this.timeout = timeout;
    }

    async downloadThumbnail(file: EnteFile) {
        if (!this.token) {
            return;
        }
        const resp = await HTTPService.get(
            getThumbnailURL(file.id),
            null,
            { 'X-Auth-Token': this.token },
            { responseType: 'arraybuffer', timeout: this.timeout }
        );
        if (typeof resp.data === 'undefined') {
            throw Error(CustomError.REQUEST_FAILED);
        }
        return new Uint8Array(resp.data);
    }

    async downloadFile(
        file: EnteFile,
        onDownloadProgress: (event: { loaded: number; total: number }) => void
    ): Promise<Uint8Array> {
        const resp = await retryAsyncFunction(() =>
            HTTPService.get(
                getFileURL(file.id),
                null,
                { 'X-Auth-Token': this.token },
                {
                    responseType: 'arraybuffer',
                    timeout: this.timeout,
                    onDownloadProgress,
                }
            )
        );
        if (typeof resp.data === 'undefined') {
            throw Error(CustomError.REQUEST_FAILED);
        }
        return new Uint8Array(resp.data);
    }

    async downloadFileStream(file: EnteFile): Promise<Response> {
        return retryAsyncFunction(() =>
            fetch(getFileURL(file.id), {
                headers: {
                    'X-Auth-Token': this.token,
                },
            })
        );
    }
}
