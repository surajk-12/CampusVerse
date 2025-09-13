import { useLocation } from "react-router-dom";
import StudentsTable from "./StudentsTable.jsx";

export default function StudentsPage() {
  const location = useLocation();
  const { collegeId, collegeName } = location.state || {};

  return <StudentsTable collegeId={collegeId} collegeName={collegeName} />;
}
