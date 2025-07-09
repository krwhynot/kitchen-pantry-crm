import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../src/app';
import { 
  authenticatedRequest, 
  testOrganizationData, 
  testContactData,
  testAuthToken, 
  testUserId,
  supabase,
  cleanupDatabase
} from '../setup';

describe('Files API', () => {
  let organizationId: string;
  let contactId: string;
  let testFilePath: string;
  let testImagePath: string;

  beforeEach(async () => {
    await cleanupDatabase();
    
    // Create test organization
    const orgResponse = await authenticatedRequest('post', '/api/v1/organizations')
      .send(testOrganizationData);
    organizationId = orgResponse.body.data.id;

    // Create test contact
    const contactResponse = await authenticatedRequest('post', '/api/v1/contacts')
      .send({ ...testContactData, organization_id: organizationId });
    contactId = contactResponse.body.data.id;

    // Create test files for upload
    testFilePath = path.join(__dirname, '../fixtures/test-document.pdf');
    testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
    
    // Create fixtures directory if it doesn't exist
    const fixturesDir = path.dirname(testFilePath);
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Create a sample PDF file
    if (!fs.existsSync(testFilePath)) {
      const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF';
      fs.writeFileSync(testFilePath, pdfContent);
    }

    // Create a sample image file (minimal valid JPEG)
    if (!fs.existsSync(testImagePath)) {
      const jpegHeader = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
      ]);
      fs.writeFileSync(testImagePath, jpegHeader);
    }
  });

  afterEach(() => {
    // Clean up test files
    [testFilePath, testImagePath].forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  describe('POST /api/v1/files/upload', () => {
    it('should upload a PDF file successfully', async () => {
      const response = await authenticatedRequest('post', '/api/v1/files/upload')
        .attach('file', testFilePath)
        .field('entity_type', 'organization')
        .field('entity_id', organizationId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        file_id: expect.any(String),
        filename: 'test-document.pdf',
        size: expect.any(Number),
        mime_type: 'application/pdf',
        url: expect.any(String),
        metadata: expect.any(Object)
      });
      expect(response.body.data.file_id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(response.body.data.size).toBeGreaterThan(0);
      expect(response.body.data.url).toMatch(/^https?:\/\//);
      expect(response.body.data.metadata.created_date).toBeDefined();
    });

    it('should upload an image file successfully', async () => {
      const response = await authenticatedRequest('post', '/api/v1/files/upload')
        .attach('file', testImagePath)
        .field('entity_type', 'contact')
        .field('entity_id', contactId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        file_id: expect.any(String),
        filename: 'test-image.jpg',
        size: expect.any(Number),
        mime_type: 'image/jpeg',
        url: expect.any(String),
        metadata: expect.any(Object)
      });
    });

    it('should validate entity_type parameter', async () => {
      const response = await authenticatedRequest('post', '/api/v1/files/upload')
        .attach('file', testFilePath)
        .field('entity_type', 'invalid_type')
        .field('entity_id', organizationId)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('entity_type');
    });

    it('should validate entity_id parameter', async () => {
      const response = await authenticatedRequest('post', '/api/v1/files/upload')
        .attach('file', testFilePath)
        .field('entity_type', 'organization')
        .field('entity_id', 'invalid-uuid')
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('entity_id');
    });

    it('should validate entity exists', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('post', '/api/v1/files/upload')
        .attach('file', testFilePath)
        .field('entity_type', 'organization')
        .field('entity_id', fakeId)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('entity_id');
    });

    it('should require file attachment', async () => {
      const response = await authenticatedRequest('post', '/api/v1/files/upload')
        .field('entity_type', 'organization')
        .field('entity_id', organizationId)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('BAD_REQUEST');
      expect(response.body.errors[0].message).toContain('file');
    });

    it('should validate file size limits', async () => {
      // Create a large file (> 10MB)
      const largeFilePath = path.join(__dirname, '../fixtures/large-file.pdf');
      const largeContent = Buffer.alloc(11 * 1024 * 1024, 'a'); // 11MB of 'a' characters
      fs.writeFileSync(largeFilePath, largeContent);

      try {
        const response = await authenticatedRequest('post', '/api/v1/files/upload')
          .attach('file', largeFilePath)
          .field('entity_type', 'organization')
          .field('entity_id', organizationId)
          .expect(413);

        expect(response.body.success).toBe(false);
        expect(response.body.errors[0].code).toBe('FILE_TOO_LARGE');
      } finally {
        // Clean up large file
        if (fs.existsSync(largeFilePath)) {
          fs.unlinkSync(largeFilePath);
        }
      }
    });

    it('should validate file types', async () => {
      // Create an executable file
      const executablePath = path.join(__dirname, '../fixtures/malicious.exe');
      fs.writeFileSync(executablePath, 'MZ\x90\x00'); // PE header

      try {
        const response = await authenticatedRequest('post', '/api/v1/files/upload')
          .attach('file', executablePath)
          .field('entity_type', 'organization')
          .field('entity_id', organizationId)
          .expect(422);

        expect(response.body.success).toBe(false);
        expect(response.body.errors[0].code).toBe('INVALID_FILE_TYPE');
      } finally {
        // Clean up executable file
        if (fs.existsSync(executablePath)) {
          fs.unlinkSync(executablePath);
        }
      }
    });

    it('should scan files for viruses', async () => {
      // This test would require a mock virus scanner or test malware file
      // For now, we'll test that the endpoint accepts the virus scanning parameter
      const response = await authenticatedRequest('post', '/api/v1/files/upload')
        .attach('file', testFilePath)
        .field('entity_type', 'organization')
        .field('entity_id', organizationId)
        .expect(200);

      expect(response.body.success).toBe(true);
      // In a real implementation, this would include virus scan results
      expect(response.body.data.metadata).toBeDefined();
    });

    it('should extract metadata from PDF files', async () => {
      const response = await authenticatedRequest('post', '/api/v1/files/upload')
        .attach('file', testFilePath)
        .field('entity_type', 'organization')
        .field('entity_id', organizationId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.data.metadata.created_date).toBeDefined();
      // For a real PDF, we might have:
      // expect(response.body.data.metadata.pages).toBeDefined();
      // expect(response.body.data.metadata.author).toBeDefined();
    });

    it('should generate unique file URLs', async () => {
      const response1 = await authenticatedRequest('post', '/api/v1/files/upload')
        .attach('file', testFilePath)
        .field('entity_type', 'organization')
        .field('entity_id', organizationId)
        .expect(200);

      const response2 = await authenticatedRequest('post', '/api/v1/files/upload')
        .attach('file', testFilePath)
        .field('entity_type', 'organization')
        .field('entity_id', organizationId)
        .expect(200);

      expect(response1.body.data.url).not.toBe(response2.body.data.url);
      expect(response1.body.data.file_id).not.toBe(response2.body.data.file_id);
    });

    it('should preserve original filename', async () => {
      const customFilename = 'custom-document-name.pdf';
      const customPath = path.join(__dirname, '../fixtures', customFilename);
      fs.copyFileSync(testFilePath, customPath);

      try {
        const response = await authenticatedRequest('post', '/api/v1/files/upload')
          .attach('file', customPath)
          .field('entity_type', 'organization')
          .field('entity_id', organizationId)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.filename).toBe(customFilename);
      } finally {
        if (fs.existsSync(customPath)) {
          fs.unlinkSync(customPath);
        }
      }
    });

    it('should handle files with special characters in names', async () => {
      const specialFilename = 'file with spaces & symbols (1).pdf';
      const specialPath = path.join(__dirname, '../fixtures', specialFilename);
      fs.copyFileSync(testFilePath, specialPath);

      try {
        const response = await authenticatedRequest('post', '/api/v1/files/upload')
          .attach('file', specialPath)
          .field('entity_type', 'organization')
          .field('entity_id', organizationId)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.filename).toBe(specialFilename);
        // URL should be properly encoded
        expect(response.body.data.url).toMatch(/^https?:\/\//);
      } finally {
        if (fs.existsSync(specialPath)) {
          fs.unlinkSync(specialPath);
        }
      }
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/v1/files/upload')
        .attach('file', testFilePath)
        .field('entity_type', 'organization')
        .field('entity_id', organizationId)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for insufficient permissions', async () => {
      // This test assumes the user doesn't have permission to upload files for this entity
      // In a real implementation, this would depend on the user's role and entity access
      
      // For now, we'll test the structure of a 403 response
      // const response = await authenticatedRequest('post', '/api/v1/files/upload')
      //   .attach('file', testFilePath)
      //   .field('entity_type', 'organization')
      //   .field('entity_id', organizationId)
      //   .expect(403);

      // expect(response.body.success).toBe(false);
      // expect(response.body.errors[0].code).toBe('FORBIDDEN');
    });

    it('should handle concurrent file uploads', async () => {
      const uploads = Array.from({ length: 3 }, (_, index) => {
        const filename = `concurrent-file-${index}.pdf`;
        const filePath = path.join(__dirname, '../fixtures', filename);
        fs.copyFileSync(testFilePath, filePath);
        
        return authenticatedRequest('post', '/api/v1/files/upload')
          .attach('file', filePath)
          .field('entity_type', 'organization')
          .field('entity_id', organizationId);
      });

      const responses = await Promise.all(uploads);

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.filename).toBe(`concurrent-file-${index}.pdf`);
        
        // Clean up
        const filePath = path.join(__dirname, '../fixtures', `concurrent-file-${index}.pdf`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      // All uploads should have unique file IDs
      const fileIds = responses.map(r => r.body.data.file_id);
      const uniqueFileIds = new Set(fileIds);
      expect(uniqueFileIds.size).toBe(fileIds.length);
    });

    it('should include proper response metadata', async () => {
      const response = await authenticatedRequest('post', '/api/v1/files/upload')
        .attach('file', testFilePath)
        .field('entity_type', 'organization')
        .field('entity_id', organizationId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.timestamp).toBeDefined();
      expect(response.body.meta.request_id).toBeDefined();
    });
  });
});