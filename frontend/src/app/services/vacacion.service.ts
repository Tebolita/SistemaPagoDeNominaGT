import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IncidenciaVacacion } from '../models/Vacacion.model';

// Aquí define la URL de tu API
const API_URL = 'http://localhost:4000/api/incidencia'; 

@Injectable({
  providedIn: 'root'
})
export class VacacionesService {

  constructor(private http: HttpClient) { }

  // Filtrar en el frontend o backend para mostrar solo 'Vacaciones'
  getVacaciones(): Observable<IncidenciaVacacion[]> {
    return this.http.get<IncidenciaVacacion[]>(API_URL);
  }

  createVacacion(vacacion: IncidenciaVacacion): Observable<IncidenciaVacacion> {
    return this.http.post<IncidenciaVacacion>(`${API_URL}/CrearIncidencia`, vacacion);
  }

  updateVacacion(id: number, vacacion: IncidenciaVacacion): Observable<IncidenciaVacacion> {
    return this.http.patch<IncidenciaVacacion>(`${API_URL}/${id}`, vacacion);
  }

  deleteVacacion(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`);
  }
}