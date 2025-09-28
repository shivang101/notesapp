import React, { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import config from "../amplify_outputs.json";
import { generateClient } from "aws-amplify/data";
import { uploadData, getUrl, remove } from "aws-amplify/storage";
import "./index.css"; // 👈 Make sure this is included

Amplify.configure(config);

const client = generateClient();

export default function App() {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [imageFile, setImageFile] = useState(null);

  const fetchNotes = async () => {
    const { data } = await client.models.Note.list();

    const notesWithUrls = await Promise.all(
      data.map(async (note) => {
        if (note.image) {
          const { url } = await getUrl({ key: note.image });
          return { ...note, imageUrl: url };
        }
        return note;
      })
    );

    setNotes(notesWithUrls);
  };

  const createNote = async () => {
    let imageKey;

    if (imageFile) {
      const key = `media/${crypto.randomUUID()}/${imageFile.name}`;
      await uploadData({ key, data: imageFile }).result;
      imageKey = key;
    }

    await client.models.Note.create({
      name: form.name,
      description: form.description,
      image: imageKey,
    });

    setForm({ name: "", description: "" });
    setImageFile(null);
    fetchNotes();
  };

  const deleteNote = async (note) => {
    await client.models.Note.delete({ id: note.id });

    if (note.image) {
      await remove({ key: note.image });
    }

    fetchNotes();
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main className="container">
          <header className="header">
            <h2>Welcome, {user.username}</h2>
            <button className="sign-out-btn" onClick={signOut}>Sign Out</button>
          </header>

          <section className="form-section">
            <h3>Create a New Note</h3>
            <div className="card form-card">
              <input
                placeholder="Note name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <input
                type="file"
                onChange={(e) => setImageFile(e.target.files[0])}
              />
              <button className="create-btn" onClick={createNote}>Create Note</button>
            </div>
          </section>

          <section className="notes-section">
            <h3>Your Notes</h3>
            <div className="notes-grid">
              {notes.map((note) => (
                <div key={note.id} className="card note-card">
                  <strong>{note.name}</strong>
                  <p>{note.description}</p>
                  {note.imageUrl && (
                    <img
                      src={note.imageUrl}
                      alt="note"
                      className="note-img"
                    />
                  )}
                  <button className="delete-btn" onClick={() => deleteNote(note)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </Authenticator>
  );
}
