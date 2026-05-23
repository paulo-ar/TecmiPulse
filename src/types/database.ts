export type NivelEducativo = 'Prepa' | 'Profesional';
export type EstatusRegistro = 'abierto' | 'cerrado' | 'sin_cierre';

export interface UsuarioGimnasio {
  matricula: string;
  nfc_id: string;
  nombre: string;
  apellidos: string;
  edad: number;
  nivel: NivelEducativo;
  doc_medico: boolean;
  doc_responsiva: boolean;
  doc_identificacion: boolean;
  doc_reglamento: boolean;
  created_at?: string;
}

export interface RegistroAcceso {
  id: string;
  matricula: string;
  hora_entrada: string;
  hora_salida: string | null;
  estatus: EstatusRegistro;
}

export interface Administrador {
  id: string;
  username: string;
  nombre_completo: string;
  rol_superadmin: boolean;
}

export interface RegistroAccesoConUsuario extends RegistroAcceso {
  usuarios_gimnasio?: Pick<UsuarioGimnasio, 'matricula' | 'nombre' | 'apellidos'> | null;
}

export interface AdministradorConCorreo extends Administrador {
  email?: string;
}
