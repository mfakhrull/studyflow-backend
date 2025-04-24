import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface INote extends Document {
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export default models.Note || model<INote>('Note', NoteSchema);
