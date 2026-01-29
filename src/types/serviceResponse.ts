// i only call this interface in bulk assign method of task assignment.
interface serviceResponse {
    status_code: number;
    status: string;
    message: string;
    data: any;
}

export { serviceResponse };