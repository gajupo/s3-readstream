import {Readable, ReadableOptions} from "stream";
import type {S3} from "aws-sdk";

export type S3ReadStreamOptions = {
  parameters: S3.GetObjectRequest;
  s3: S3;
  maxLength: number;
  startByte: number;
  endByte: number;
}

export class S3ReadStream extends Readable {
	_maxContentLength: number;
	_s3: S3;
	_s3StreamParams: S3.GetObjectRequest;
	_startByte: number;
	_endByte: number;

	constructor(options: S3ReadStreamOptions, nodeReadableStreamOptions?: ReadableOptions) {
		super(nodeReadableStreamOptions);
		this._maxContentLength = options.maxLength;
		this._s3 = options.s3;
		this._s3StreamParams = options.parameters;
		this._startByte = options.startByte;
		this._endByte = options.endByte;
	}

	_read() {
		if (this._endByte > this._maxContentLength || this._endByte < this._startByte || this._startByte < 0) {
			this.push(null);
		} else {
			this._s3StreamParams.Range = `bytes=${this._startByte}-${this._endByte}`;
			this._s3.getObject(this._s3StreamParams, (error, data) => {
				if (error) {
					this.destroy(error);
				} else {
					this.push(data.Body);
					// will terminate the stream reading if the end byte is reached
					this.push(null);
				}
			});
		}
	}
}

