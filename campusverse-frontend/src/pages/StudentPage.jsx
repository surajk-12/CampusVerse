import { useLocation, useParams } from "react-router-dom";
import StudentsTable from "./StudentsTable.jsx";

export default function StudentsPage() {
  const { collegeId } = useParams();
  const location = useLocation();
  const { collegeName } = location.state || {};

  return <StudentsTable collegeId={collegeId} collegeName={collegeName} />;
}
