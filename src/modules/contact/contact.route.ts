import { Router } from 'express';
import { createContact } from './contact.controller';

export const contactRoutes = Router();

contactRoutes.post('/', createContact);
