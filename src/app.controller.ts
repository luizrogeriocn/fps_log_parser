import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getUploadForm() {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Upload File</title>
        </head>
        <body>
          <h1>Upload File</h1>
          <form action="/matches/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="file" />
            <button type="submit">Upload</button>
          </form>
        </body>
      </html>
    `;
  }
}
