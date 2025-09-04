import {
  collection,
  CollectionReference,
  DocumentData,
  Firestore,
  getDocs,
  getFirestore,
  addDoc,
} from "firebase/firestore/lite";
import { firebaseApp } from "../firebase/config";
import { BaseFirebaseEntityClass } from "../interface";

export class EventsService implements BaseFirebaseEntityClass<Event> {
  private readonly db: Firestore;
  private readonly eventsCollection: CollectionReference<DocumentData>;
  constructor() {
    this.db = getFirestore(firebaseApp);
    this.eventsCollection = collection(this.db, "events");
  }

  async setEntity(entity: Event): Promise<string> {
    try {
      const doc = await addDoc(this.eventsCollection, entity);
      return doc.id;
    } catch (error) {
      throw error;
    }
  }

  async getEntityById(id: string): Promise<Event> {
    const eventsSnapshot = await getDocs(this.eventsCollection);
    const events = eventsSnapshot.docs.map((doc) => doc.data() as Event);
    return events.find((event) => event.id === id) as Event;
  }

  async getAllEntities(): Promise<Event[]> {
    const eventsSnapshot = await getDocs(this.eventsCollection);
    return eventsSnapshot.docs.map((doc) => doc.data() as Event);
  }
}
